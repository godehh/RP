const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9232', '--disable-gpu', '--window-size=390,844', 'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise(r => http.get('http://localhost:9232/json', res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
    }));
    const ws = new globalThis.WebSocket(list[0].webSocketDebuggerUrl);
    let id = 1;
    const send = (m, p = {}) => new Promise(r => {
      const i = id++;
      const h = e => { const res = JSON.parse(e.data); if (res.id === i) { ws.removeEventListener('message', h); r(res.result); }};
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: i, method: m, params: p }));
    });
    ws.onopen = async () => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await send('Page.navigate', { url: 'http://localhost:3000/product.html?id=spices-poondu' });
      await new Promise(r => setTimeout(r, 1200));
      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const wrap = document.querySelector('.product-gallery-wrap');
          if (!wrap) return null;
          return Array.from(wrap.children).map(c => ({
            tag: c.tagName,
            class: c.className,
            scrollWidth: c.scrollWidth,
            offsetWidth: c.offsetWidth,
            rectWidth: c.getBoundingClientRect().width,
            computedWidth: window.getComputedStyle(c).width
          }));
        })()`,
        returnByValue: true
      });
      console.log('GALLERY CHILDREN:', JSON.stringify(res.result.value, null, 2));
      ws.close(); chrome.kill(); process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
