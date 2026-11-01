const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9237', '--disable-gpu', '--window-size=390,844', 'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise(r => http.get('http://localhost:9237/json', res => {
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
      const widths = [320, 360, 375, 390, 412, 480];
      console.log('--- VERIFYING PDP ON ALL MOBILE WIDTHS ---');

      for (const w of widths) {
        await send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 2, mobile: true });
        await send('Page.navigate', { url: 'http://localhost:3000/product.html?id=spices-poondu' });
        await new Promise(r => setTimeout(r, 1200));

        const res = await send('Runtime.evaluate', {
          expression: `(() => {
            const doc = document.documentElement;
            const b = document.body;
            const img = document.getElementById('detail-main-img');
            const mainView = document.querySelector('.product-main-view');
            const rView = mainView ? mainView.getBoundingClientRect() : null;
            return {
              width: window.innerWidth,
              hasHOverflow: doc.scrollWidth > window.innerWidth || b.scrollWidth > window.innerWidth,
              imgLoaded: img ? img.complete && img.naturalWidth > 0 : false,
              mainViewW: rView ? Math.round(rView.width) : null,
              mainViewH: rView ? Math.round(rView.height) : null
            };
          })()`,
          returnByValue: true
        });

        console.log(`Width ${w}px:`, JSON.stringify(res.result.value));
      }

      ws.close(); chrome.kill(); process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
