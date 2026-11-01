const { spawn } = require('child_process');
const http = require('http');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9230',
  '--disable-gpu',
  '--window-size=400,800',
  'about:blank'
]);

setTimeout(async () => {
  const list = await new Promise(res => http.get('http://localhost:9230/json', r => {
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

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrap = document.querySelector('.hero-carousel-wrap');
        const dots = document.querySelectorAll('.hero-dot');
        const slides = document.querySelectorAll('.hero-carousel-slide');
        return JSON.stringify({
          wrapExists: !!wrap,
          wrapRect: wrap ? wrap.getBoundingClientRect() : null,
          dotsCount: dots.length,
          slidesCount: slides.length,
          dot1Rect: dots[1] ? dots[1].getBoundingClientRect() : null
        });
      })()`
    });
    console.log('BEFORE CLICK:', res.result.value);

    // Click dot 2
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.hero-dot')[1].click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const resAfter = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrap = document.querySelector('.hero-carousel-wrap');
        const track = document.querySelector('.hero-carousel-track');
        const slides = document.querySelectorAll('.hero-carousel-slide');
        return JSON.stringify({
          wrapRect: wrap ? wrap.getBoundingClientRect() : null,
          trackRect: track ? track.getBoundingClientRect() : null,
          slides: Array.from(slides).map((s, idx) => ({
            idx,
            className: s.className,
            rect: s.getBoundingClientRect(),
            panelRect: s.querySelector('.hero-slide-panel') ? s.querySelector('.hero-slide-panel').getBoundingClientRect() : null
          }))
        }, null, 2);
      })()`
    });
    console.log('AFTER CLICK:', resAfter.result.value);

    ws.close(); chrome.kill(); process.exit(0);
  };
}, 1200);
