const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--disable-gpu',
  '--window-size=400,800',
  'about:blank'
]);

setTimeout(async () => {
  const list = await new Promise(res => http.get('http://localhost:9229/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }));
  const ws = new globalThis.WebSocket(list[0].webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(r => {
    const reqId = id++;
    const h = e => { const m = JSON.parse(e.data); if (m.id === reqId) { ws.removeEventListener('message', h); r(m.result); }};
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });
  ws.onopen = async () => {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 800, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 1500));
    await send('Runtime.evaluate', { expression: 'document.querySelectorAll(".hero-dot")[1].click()' });
    await new Promise(r => setTimeout(r, 800));

    const stack = await send('Runtime.evaluate', {
      expression: 'JSON.stringify(document.elementsFromPoint(200, 200).map(e => ({ tag: e.tagName, cls: e.className, id: e.id })))'
    });
    console.log('STACK AT (200, 200):', stack.result.value);

    // Let's also check overflow on track, wrap, body, and all ancestors!
    const trackAncestors = await send('Runtime.evaluate', {
      expression: `(() => {
        let el = document.querySelector('.hero-carousel-track');
        const res = [];
        while (el) {
          const cs = window.getComputedStyle(el);
          const r = el.getBoundingClientRect();
          res.push({
            tag: el.tagName,
            cls: el.className,
            overflow: cs.overflow,
            overflowX: cs.overflowX,
            overflowY: cs.overflowY,
            width: cs.width,
            rect: { x: r.x, y: r.y, w: r.width, h: r.height }
          });
          el = el.parentElement;
        }
        return JSON.stringify(res, null, 2);
      })()`
    });
    console.log('ANCESTORS:', trackAncestors.result.value);

    ws.close(); chrome.kill(); process.exit(0);
  };
}, 1200);
