const fs = require('fs');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const missing = [];

htmlFiles.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  
  const cssMatches = Array.from(html.matchAll(/href=["']([^"']+\.css)["']/g)).map(m => m[1]);
  const jsMatches = Array.from(html.matchAll(/src=["']([^"']+\.js)["']/g)).map(m => m[1]);
  const imgMatches = Array.from(html.matchAll(/src=["']([^"']+\.(?:png|jpg|jpeg|svg|webp))["']/g)).map(m => m[1]);
  
  const allRefs = [...cssMatches, ...jsMatches, ...imgMatches];
  allRefs.forEach(ref => {
    if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//')) return;
    const cleanPath = ref.split('?')[0].split('#')[0];
    if (!fs.existsSync(cleanPath)) {
      missing.push({ file, ref: cleanPath });
    }
  });
});

console.log('Total HTML files scanned:', htmlFiles.length);
console.log('Missing assets count:', missing.length);
if (missing.length > 0) {
  console.log('Missing assets:', missing);
} else {
  console.log('✓ All CSS, JS, and image references exist on disk across all HTML files!');
}
