const fs = require('fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const productHtml = fs.readFileSync('product.html', 'utf8');

const getMobileHeader = (content) => {
  const barStart = content.indexOf('class="mobile-header-bar"');
  const barEnd = content.indexOf('</header>');
  return content.slice(barStart, barEnd);
};

console.log('Index mobile header length:', getMobileHeader(indexHtml).length);
console.log('Product mobile header length:', getMobileHeader(productHtml).length);
console.log('Are they identical?', getMobileHeader(indexHtml) === getMobileHeader(productHtml));
