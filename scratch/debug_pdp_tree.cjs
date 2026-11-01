const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9230',
  '--disable-gpu',
  '--window-size=390,844',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9230/json', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const page = list.find(p => p.type === 'page');
    const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === reqId) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });

      await send('Page.navigate', { url: 'http://localhost:3000/product.html?id=spices-poondu' });
      await new Promise(r => setTimeout(r, 1200));

      const treeRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const img = document.getElementById('detail-main-img');
          let el = img;
          const chain = [];
          while (el && el !== document.documentElement) {
            const cs = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            chain.unshift({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              width: cs.width,
              minWidth: cs.minWidth,
              maxWidth: cs.maxWidth,
              boxSizing: cs.boxSizing,
              padding: cs.padding,
              margin: cs.margin,
              rectWidth: r.width,
              rectLeft: r.left
            });
            el = el.parentElement;
          }
          return chain;
        })()`,
        returnByValue: true
      });

      console.log('DOM PARENT CHAIN:', JSON.stringify(treeRes.result.value, null, 2));

      ws.close();
      chrome.kill();
      process.exit(0);
    };

  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
