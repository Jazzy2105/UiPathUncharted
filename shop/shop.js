// Kudu & Co - Black Friday demo shop.
// The system under test for the UiPath Uncharted "Dark Testing Factory" post.
// All money is handled in cents. Two bugs are planted on purpose; see the blog post.

const PRODUCTS = [
  { sku: 'BILTONG-250', name: 'Beef Biltong 250g', cat: 'pantry', price: 18999, art: '🥩', tint: '#8a3b1d' },
  { sku: 'ROOIBOS-80', name: 'Rooibos Tea 80s', cat: 'pantry', price: 6499, art: '🍵', tint: '#b5522a' },
  { sku: 'COFFEE-1KG', name: 'Single Origin Coffee 1kg', cat: 'pantry', price: 32999, art: '☕', tint: '#5b3a24' },
  { sku: 'RUSKS-500', name: 'Buttermilk Rusks 500g', cat: 'pantry', price: 7999, art: '🍪', tint: '#c08a3e' },
  { sku: 'SPEAKER-BT', name: 'Bluetooth Speaker', cat: 'electronics', price: 129900, art: '🔊', tint: '#1f4e79' },
  { sku: 'AIRFRYER-5L', name: 'Air Fryer 5L', cat: 'electronics', price: 189900, art: '🍟', tint: '#2d6a4f' },
  { sku: 'EARBUDS-PRO', name: 'Wireless Earbuds', cat: 'electronics', price: 89900, art: '🎧', tint: '#3d348b' },
  { sku: 'BRAAI-57', name: 'Kettle Braai 57cm', cat: 'outdoor', price: 249900, art: '🔥', tint: '#9d0208' },
];

const MAX_QTY = 5;
const DELIVERY_FEE = 9900;
const FREE_DELIVERY_FROM = 75000;
const PROMO_CODE = 'BLACKFRIDAY';
const PROMO_RATE = 0.2;

const basket = new Map(); // sku -> qty
let promoApplied = false;

const $ = (sel) => document.querySelector(sel);
const rand = (cents) => {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return sign + 'R' + Math.floor(abs / 100).toLocaleString('en-ZA').replace(/ |,/g, ' ') + '.' + String(abs % 100).padStart(2, '0');
};

// ─── Pricing ─────────────────────────────────────────
function price() {
  const lines = [...basket].map(([sku, qty]) => {
    const p = PRODUCTS.find((x) => x.sku === sku);
    return { ...p, qty, gross: p.price * qty, freeUnits: 0 };
  });

  // 3 for 2 on Pantry: for every 3 pantry units, the cheapest unit is free (mix and match)
  const pantryUnits = lines
    .filter((l) => l.cat === 'pantry')
    .flatMap((l) => Array(l.qty).fill(l))
    .sort((a, b) => a.price - b.price);
  let free = Math.floor(pantryUnits.length / 3);
  for (const l of pantryUnits) {
    if (!free) break;
    l.freeUnits += 1;
    free -= 1;
  }

  for (const l of lines) {
    l.deal = l.freeUnits * l.price;
    l.afterDeal = l.gross - l.deal;
    // BLACKFRIDAY excludes items already on the 3 for 2 deal, so the two promotions never stack.
    l.code = promoApplied && l.cat !== 'pantry' ? Math.round(l.afterDeal * PROMO_RATE) : 0;
    l.final = l.afterDeal - l.code;
  }

  const subtotal = lines.reduce((s, l) => s + l.gross, 0);
  const deal = lines.reduce((s, l) => s + l.deal, 0);
  const code = lines.reduce((s, l) => s + l.code, 0);
  const items = subtotal - deal - code;
  const delivery = items === 0 || items >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = items + delivery;

  // Prices include VAT, so VAT = total x 15/115, calculated once on the order total.
  const vat = Math.round((total * 15) / 115);

  // Double Kudu Rewards: 2 points per full R10 spent on items (delivery excluded)
  const points = Math.floor(items / 1000) * 2;

  return { lines, subtotal, deal, code, items, delivery, total, vat, points };
}

// ─── Rendering ───────────────────────────────────────
function renderProducts() {
  $('#productGrid').innerHTML = PRODUCTS.map((p) => `
    <article class="card" data-testid="product-${p.sku}">
      <div class="art" style="--tint:${p.tint}" aria-hidden="true"><span>${p.art}</span></div>
      ${p.cat === 'pantry' ? '<span class="badge">3 for 2</span>' : ''}
      <h3>${p.name}</h3>
      <p class="sku">${p.sku}</p>
      <p class="price" data-testid="price-${p.sku}">${rand(p.price)}</p>
      <button type="button" class="add" data-sku="${p.sku}" data-testid="add-${p.sku}">Add to basket</button>
    </article>`).join('');
}

function renderBasket() {
  const r = price();
  const count = [...basket.values()].reduce((s, q) => s + q, 0);
  $('[data-testid="cart-count"]').textContent = count;
  $('[data-testid="basket-empty"]').hidden = count > 0;

  $('#basketLines').innerHTML = r.lines.map((l) => `
    <li class="line" data-testid="line-${l.sku}">
      <span class="line-art" style="--tint:${l.tint}" aria-hidden="true">${l.art}</span>
      <div class="line-info">
        <p class="line-name">${l.name}</p>
        <p class="line-price">${rand(l.price)} each${l.freeUnits ? ` <em>${l.freeUnits} free</em>` : ''}</p>
      </div>
      <div class="qty">
        <button type="button" data-act="dec" data-sku="${l.sku}" data-testid="dec-${l.sku}" aria-label="Remove one">&minus;</button>
        <span data-testid="qty-${l.sku}">${l.qty}</span>
        <button type="button" data-act="inc" data-sku="${l.sku}" data-testid="inc-${l.sku}" aria-label="Add one">+</button>
      </div>
    </li>`).join('');

  $('[data-testid="subtotal"]').textContent = rand(r.subtotal);
  $('[data-testid="deal-discount"]').textContent = rand(-r.deal);
  $('[data-testid="code-discount"]').textContent = rand(-r.code);
  $('[data-testid="delivery"]').textContent = count ? (r.delivery ? rand(r.delivery) : 'Free') : rand(0);
  $('[data-testid="total"]').textContent = rand(r.total);
  $('[data-testid="vat"]').textContent = rand(r.vat);
  $('[data-testid="points"]').textContent = r.points.toLocaleString('en-ZA');

  const hint = $('[data-testid="free-delivery-hint"]');
  hint.textContent = count && r.delivery
    ? `Add ${rand(FREE_DELIVERY_FROM - r.items)} more for free delivery.`
    : count ? 'You qualify for free delivery.' : '';

  $('[data-testid="checkout"]').disabled = count === 0;
}

function setQty(sku, qty) {
  const msg = $('[data-testid="limit-message"]');
  msg.hidden = true;
  if (qty > MAX_QTY) {
    msg.textContent = `Black Friday limit: ${MAX_QTY} per product per order.`;
    msg.hidden = false;
    qty = MAX_QTY;
  }
  if (qty <= 0) basket.delete(sku);
  else basket.set(sku, qty);
  renderBasket();
}

// ─── Events ──────────────────────────────────────────
document.addEventListener('click', (e) => {
  const add = e.target.closest('.add');
  if (add) {
    setQty(add.dataset.sku, (basket.get(add.dataset.sku) || 0) + 1);
    add.classList.add('added');
    setTimeout(() => add.classList.remove('added'), 600);
    return;
  }
  const step = e.target.closest('[data-act]');
  if (step) {
    const q = basket.get(step.dataset.sku) || 0;
    setQty(step.dataset.sku, step.dataset.act === 'inc' ? q + 1 : q - 1);
  }
});

$('#promoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = $('#promoInput').value.trim().toUpperCase();
  const msg = $('[data-testid="promo-message"]');
  if (code === PROMO_CODE) {
    promoApplied = true;
    msg.textContent = 'BLACKFRIDAY applied: 20% off items not already on a deal.';
    msg.className = 'promo-msg ok';
  } else {
    promoApplied = false;
    msg.textContent = code ? 'That code is not valid.' : 'Enter a promo code.';
    msg.className = 'promo-msg err';
  }
  renderBasket();
});

$('[data-testid="checkout"]').addEventListener('click', () => {
  const r = price();
  $('[data-testid="order-number"]').textContent = 'KC-BF-' + String(Date.now()).slice(-6);
  $('[data-testid="order-total"]').textContent = rand(r.total);
  $('#basketView').hidden = true;
  $('#confirmView').hidden = false;
});

$('[data-testid="new-order"]').addEventListener('click', () => {
  basket.clear();
  promoApplied = false;
  $('#promoInput').value = '';
  $('[data-testid="promo-message"]').textContent = '';
  $('#confirmView').hidden = true;
  $('#basketView').hidden = false;
  renderBasket();
});

$('[data-testid="cart-toggle"]').addEventListener('click', () => {
  $('#basket').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Countdown to Black Friday (27 Nov 2026, 00:00 SAST)
(function clock() {
  const el = $('#bfClock');
  const target = new Date('2026-11-27T00:00:00+02:00').getTime();
  const tick = () => {
    const d = target - Date.now();
    if (d <= 0) { el.textContent = 'Deals are live'; return; }
    const days = Math.floor(d / 86400000);
    const h = Math.floor((d % 86400000) / 3600000);
    const m = Math.floor((d % 3600000) / 60000);
    el.textContent = `${days}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };
  tick();
  setInterval(tick, 30000);
})();

renderProducts();
renderBasket();
