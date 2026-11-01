const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9227', '--disable-gpu', '--window-size=400,645', 'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((res, rej) => http.get('http://localhost:9227/json', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej));

    const page = list.find(p => p.type === 'page');
    const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const send = (m, p = {}) => new Promise(r => {
      const reqId = id++;
      const h = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === reqId) {
          ws.removeEventListener('message', h);
          r(msg.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: reqId, method: m, params: p }));
    });

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 400,
        height: 645,
        deviceScaleFactor: 2,
        mobile: true
      });
      await send('Page.navigate', { url: 'http://localhost:3000/' });
      await new Promise(r => setTimeout(r, 1500));

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const els = Array.from(document.querySelectorAll('*'));
          const overflows = [];
          els.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 400.5 || r.right > 400.5) {
              overflows.push({
                tag: el.tagName,
                cls: el.className,
                width: Math.round(r.width),
                right: Math.round(r.right),
                x: Math.round(r.x)
              });
            }
          });
          return JSON.stringify(overflows.slice(0, 20));
        })()`
      });

      console.log('OVERFLOW ELEMENTS AT 400px:');
      console.log(JSON.parse(res.result.value));
      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch(e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1200);
