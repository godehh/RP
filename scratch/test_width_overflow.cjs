const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9233', '--disable-gpu', '--window-size=390,844', 'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise(r => http.get('http://localhost:9233/json', res => {
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
      
      // Wait for #detail-main-img to exist
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 100));
        const chk = await send('Runtime.evaluate', {
          expression: `!!document.getElementById('detail-main-img')`
        });
        if (chk.result && chk.result.value) break;
      }

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const wrap = document.querySelector('.product-gallery-wrap');
          const layout = document.querySelector('.product-detail-layout');
          const info = document.querySelector('.product-info-col');
          
          function item(el) {
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              cls: el.className,
              width: cs.width,
              minWidth: cs.minWidth,
              maxWidth: cs.maxWidth,
              rectW: r.width,
              rectH: r.height,
              rectL: r.left,
              rectR: r.right
            };
          }

          const wrapChildren = Array.from(wrap.children).map(item);
          const allDescendants = Array.from(wrap.querySelectorAll('*')).map(item);
          // Find any descendant with rectW > 360
          const wideDescendants = allDescendants.filter(d => d && d.rectW > 360);

          return {
            windowW: window.innerWidth,
            layout: item(layout),
            wrap: item(wrap),
            info: item(info),
            wrapChildren,
            wideDescendants
          };
        })()`,
        returnByValue: true
      });

      console.log('WIDTH ANALYSIS:', JSON.stringify(res.result.value, null, 2));
      ws.close(); chrome.kill(); process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
