const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9235', '--disable-gpu', '--window-size=390,844', 'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise(r => http.get('http://localhost:9235/json', res => {
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
      await new Promise(r => setTimeout(r, 1500));

      const overflowRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const overflowing = [];
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > window.innerWidth + 2 || el.scrollWidth > window.innerWidth + 2) {
              overflowing.push({
                tag: el.tagName,
                id: el.id,
                class: el.className,
                rectRight: Math.round(r.right),
                scrollWidth: el.scrollWidth,
                width: Math.round(r.width),
                outerHTML: el.outerHTML.slice(0, 100)
              });
            }
          });
          return overflowing;
        })()`,
        returnByValue: true
      });

      console.log('OVERFLOWING ELEMENTS:', JSON.stringify(overflowRes.result.value, null, 2));
      ws.close(); chrome.kill(); process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
