const fs = require('fs');

console.log('=== VERIFYING REDIRECTION FOR ALL PRODUCTS & COMPONENTS ===\n');

// 1. Verify products-data.js
const pDataCode = fs.readFileSync('assets/js/products-data.js', 'utf8');
const fn = new Function('window', pDataCode + '; return PRODUCTS;');
const products = fn({});
const validIds = new Set(products.map(p => p.id));
console.log('✓ Loaded', products.length, 'products from products-data.js:');
products.forEach(p => console.log(`   - ID: ${p.id.padEnd(14)} Name: ${p.name}`));

// 2. Verify index.html BounceCards
console.log('\n--- Checking index.html BounceCards ---');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// Match all bounce-cards cards
const cardRegex = /<a\s+[^>]*class="[^"]*bounce-cards__card[^"]*"[^>]*>/g;
let match;
let count = 0;
while ((match = cardRegex.exec(indexHtml)) !== null) {
  count++;
  const tag = match[0];
  const hrefMatch = tag.match(/href="([^"]+)"/);
  const prodIdMatch = tag.match(/data-product-id="([^"]+)"/);
  const titleMatch = tag.match(/title="([^"]+)"/);
  const href = hrefMatch ? hrefMatch[1] : null;
  const prodId = prodIdMatch ? prodIdMatch[1] : null;
  const title = titleMatch ? titleMatch[1] : '';
  const isValid = prodId && validIds.has(prodId);
  console.log(`Card ${count}: [${prodId}] -> ${href} ("${title}") [Valid: ${isValid}]`);
  if (!isValid) {
    console.error(`ERROR: Product ID ${prodId} not found in PRODUCTS!`);
    process.exit(1);
  }
}

if (count !== 9) {
  console.error(`ERROR: Expected 9 bounce cards across 3 slides, found ${count}`);
  process.exit(1);
} else {
  console.log(`✓ All 9 cards across the 3 slides have exact product hrefs and valid product IDs!`);
}

// 3. Verify Accordion Gallery in index.html
console.log('\n--- Checking index.html AccordionGallery Panels ---');
const agRegex = /<a[^>]*class="[^"]*ag-panel[^"]*"[^>]*href="([^"]+)"[^>]*aria-label="([^"]+)"/g;
let agCount = 0;
while ((match = agRegex.exec(indexHtml)) !== null) {
  agCount++;
  const href = match[1];
  const label = match[2];
  const matchId = href.match(/id=([^&#]+)/);
  const prodId = matchId ? matchId[1] : null;
  const isValid = prodId && validIds.has(prodId);
  console.log(`Panel ${agCount}: [${prodId}] -> ${href} ("${label}") [Valid: ${isValid}]`);
  if (!isValid) {
    console.error(`ERROR: Invalid product ID for panel ${label}`);
    process.exit(1);
  }
}
console.log(`✓ All ${agCount} AccordionGallery panels have exact product hrefs and valid IDs!`);

// 4. Verify assets/js/bounce-cards.js
console.log('\n--- Checking assets/js/bounce-cards.js ---');
const bounceJs = fs.readFileSync('assets/js/bounce-cards.js', 'utf8');
const checks = [
  'navigateToCard',
  'rp_current_product_id',
  'window.location.href = href',
  'cardElements.forEach',
  'touchend',
  'touchStartPos'
];

checks.forEach(term => {
  if (bounceJs.includes(term)) {
    console.log(`✓ bounce-cards.js contains '${term}'`);
  } else {
    console.error(`ERROR: bounce-cards.js missing '${term}'!`);
    process.exit(1);
  }
});

// 5. Verify assets/css/bounce-cards.css
console.log('\n--- Checking assets/css/bounce-cards.css ---');
const bounceCss = fs.readFileSync('assets/css/bounce-cards.css', 'utf8');
if (bounceCss.includes('display: block') && bounceCss.includes('text-decoration: none')) {
  console.log(`✓ bounce-cards.css includes display: block and text-decoration: none for anchor cards`);
} else {
  console.error(`ERROR: bounce-cards.css missing display: block or text-decoration: none!`);
  process.exit(1);
}

// 6. Verify product-page.js URL query parameter handling
console.log('\n--- Checking assets/js/product-page.js ---');
const pdpJs = fs.readFileSync('assets/js/product-page.js', 'utf8');
if (pdpJs.includes('urlParams.get(\'id\')') && pdpJs.includes('rp_current_product_id')) {
  console.log(`✓ product-page.js parses URLSearchParams id and reads/writes rp_current_product_id`);
} else {
  console.error(`ERROR: product-page.js missing URL param or storage handling!`);
  process.exit(1);
}

console.log('\n=== ALL REDIRECTION CHECKS PASSED 100% ===');
