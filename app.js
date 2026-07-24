const STORAGE_KEY = 'sbt_order_v1';

function genOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 13; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function defaultOrder() {
  return {
    storeName: 'Sunrise Bakery — Ferry Building',
    storeAddress: '1 Ferry Building, San Francisco, CA 94111, USA',
    item: '1x Surprise Bag',
    price: '$5.99',
    date: 'Jul 23, 2026',
    window: '5:45 PM - 6:00 PM',
    payment: 'Apple Pay: Mastercard',
    packaging: 'The store will provide packaging for your food, but we encourage you to bring your own bag to carry it home in.',
    foodsafety: 'Storing Bread at Room Temperature (in a cool, dry place - not the fridge): To maintain a texture contrast between the interior and exterior of the loaf, keep the loaf in its paper bag and store the bag in a bread box or a drawer.',
    orderId: genOrderId(),
    status: 'confirmed', // 'confirmed' | 'pickedUp'
    pickedUpDate: null,
    rating: 0
  };
}

function loadOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOrder();
    return { ...defaultOrder(), ...JSON.parse(raw) };
  } catch (e) {
    return defaultOrder();
  }
}

function saveOrder(order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

let order = loadOrder();

const el = (id) => document.getElementById(id);

function initials(name) {
  return (name.trim()[0] || '?').toUpperCase();
}

function render() {
  el('store-name').textContent = order.storeName;
  el('store-address').textContent = order.storeAddress;
  el('store-logo').textContent = initials(order.storeName);
  el('val-date').textContent = order.date;
  el('val-window').textContent = order.window;
  el('val-item').textContent = order.item;
  el('val-price').textContent = order.price;
  el('val-item-2').textContent = order.item;
  el('val-price-2').textContent = order.price;
  el('val-packaging').textContent = order.packaging;
  el('val-foodsafety').textContent = order.foodsafety;
  el('val-payment').textContent = order.payment;
  el('val-orderid').textContent = order.orderId;
  el('val-pickedup-date').textContent = order.pickedUpDate || order.date;
  el('sheet-item-label').textContent = order.item;
  el('sheet-price').textContent = order.price;
  el('code-box').textContent = order.orderId;

  const storeBlock = el('store-block');
  const ribbon = el('ribbon');
  const preRows = el('pre-rows');
  const postRows = el('post-rows');
  const preText = el('pre-text');
  const tabs = el('tabs');
  const bottomBar = el('bottom-bar');
  const ratingBanner = el('rating-banner');
  const needHelp = el('need-help');

  if (order.status === 'pickedUp') {
    storeBlock.classList.add('row-layout');
    ribbon.classList.remove('hidden');
    preRows.classList.add('hidden');
    postRows.classList.remove('hidden');
    preText.classList.add('hidden');
    tabs.classList.add('hidden');
    bottomBar.classList.add('hidden');
    ratingBanner.classList.remove('hidden');
    needHelp.classList.remove('hidden');
    renderStars();
  } else {
    storeBlock.classList.remove('row-layout');
    ribbon.classList.add('hidden');
    preRows.classList.remove('hidden');
    postRows.classList.add('hidden');
    preText.classList.remove('hidden');
    tabs.classList.remove('hidden');
    bottomBar.classList.remove('hidden');
    ratingBanner.classList.add('hidden');
    needHelp.classList.add('hidden');
  }
}

function renderStars() {
  document.querySelectorAll('#stars .star').forEach((btn) => {
    const v = Number(btn.dataset.v);
    btn.classList.toggle('filled', v <= order.rating);
  });
}

el('stars').addEventListener('click', (e) => {
  const btn = e.target.closest('.star');
  if (!btn) return;
  order.rating = Number(btn.dataset.v);
  saveOrder(order);
  renderStars();
});

el('find-store').addEventListener('click', (e) => {
  e.preventDefault();
  const q = encodeURIComponent(order.storeAddress);
  window.open(`https://maps.apple.com/?q=${q}`, '_blank');
});

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ===== Pickup sheet =====
const overlay = el('overlay');
const swipeState = el('swipe-state');
const confirmedState = el('confirmed-state');

el('btn-tap-pickup').addEventListener('click', () => {
  swipeState.classList.remove('hidden');
  confirmedState.classList.add('hidden');
  resetKnob();
  overlay.classList.remove('hidden');
});

el('sheet-close').addEventListener('click', () => {
  overlay.classList.add('hidden');
});

function completePickup() {
  const now = new Date();
  order.status = 'pickedUp';
  order.pickedUpDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  saveOrder(order);
  swipeState.classList.add('hidden');
  confirmedState.classList.remove('hidden');
  render();
}

// swipe-to-confirm gesture
const track = el('swipe-track');
const knob = el('swipe-knob');
let dragging = false;
let startX = 0;
let maxX = 0;

function resetKnob() {
  knob.style.transform = 'translateX(0px)';
}

function trackRange() {
  maxX = track.clientWidth - knob.clientWidth - 8;
}

function onPointerDown(e) {
  dragging = true;
  trackRange();
  startX = (e.touches ? e.touches[0].clientX : e.clientX) - currentKnobX();
  knob.setPointerCapture && e.pointerId != null && knob.setPointerCapture(e.pointerId);
}

function currentKnobX() {
  const t = knob.style.transform.match(/translateX\(([-0-9.]+)px\)/);
  return t ? parseFloat(t[1]) : 0;
}

function onPointerMove(e) {
  if (!dragging) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let x = clientX - startX;
  x = Math.max(0, Math.min(maxX, x));
  knob.style.transform = `translateX(${x}px)`;
  if (x >= maxX - 2) {
    dragging = false;
    completePickup();
  }
}

function onPointerUp() {
  if (!dragging) return;
  dragging = false;
  const x = currentKnobX();
  if (x < maxX - 2) resetKnob();
}

knob.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
knob.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onPointerUp);

// ===== Edit sheet =====
const editOverlay = el('edit-overlay');

el('btn-back').addEventListener('click', () => {
  el('f-store-name').value = order.storeName;
  el('f-store-address').value = order.storeAddress;
  el('f-item').value = order.item;
  el('f-price').value = order.price;
  el('f-date').value = order.date;
  el('f-window').value = order.window;
  el('f-payment').value = order.payment;
  el('f-packaging').value = order.packaging;
  el('f-foodsafety').value = order.foodsafety;
  editOverlay.classList.remove('hidden');
});

el('edit-close').addEventListener('click', () => editOverlay.classList.add('hidden'));

el('btn-save-edit').addEventListener('click', () => {
  order.storeName = el('f-store-name').value || order.storeName;
  order.storeAddress = el('f-store-address').value || order.storeAddress;
  order.item = el('f-item').value || order.item;
  order.price = el('f-price').value || order.price;
  order.date = el('f-date').value || order.date;
  order.window = el('f-window').value || order.window;
  order.payment = el('f-payment').value || order.payment;
  order.packaging = el('f-packaging').value || order.packaging;
  order.foodsafety = el('f-foodsafety').value || order.foodsafety;
  saveOrder(order);
  render();
  editOverlay.classList.add('hidden');
});

el('btn-new-order').addEventListener('click', () => {
  const keep = { ...order };
  order = {
    ...keep,
    orderId: genOrderId(),
    status: 'confirmed',
    pickedUpDate: null,
    rating: 0
  };
  saveOrder(order);
  render();
  editOverlay.classList.add('hidden');
});

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
