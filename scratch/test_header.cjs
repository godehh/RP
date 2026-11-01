const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const headerIdx = html.indexOf('<header class="main-header"');
const headerCloseIdx = html.indexOf('</header>');
console.log('Header length in index.html:', headerCloseIdx - headerIdx);

const mobileBarIdx = html.indexOf('mobile-header-bar');
console.log('mobile-header-bar exists inside header:', mobileBarIdx > headerIdx && mobileBarIdx < headerCloseIdx);

const mobileSearchIdx = html.indexOf('mobile-search-row');
console.log('mobile-search-row exists inside header:', mobileSearchIdx > headerIdx && mobileSearchIdx < headerCloseIdx);
