const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9228',
  '--disable-gpu',
  '--window-size=400,800',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9228/json', res => {
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
        width: 400,
        height: 800,
        deviceScaleFactor: 2,
        mobile: true
      });

      await send('Page.navigate', { url: 'http://localhost:3000' });
      await new Promise(r => setTimeout(r, 1500));

      // Click dot 2 (slide index 1)
      await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.hero-dot')[1].click()`
      });
      await new Promise(r => setTimeout(r, 800));

      // Check elementFromPoint across the screen!
      const inspection = await send('Runtime.evaluate', {
        expression: `(() => {
          const points = [];
          for (let y = 150; y < 650; y += 50) {
            for (let x = 50; x < 350; x += 100) {
              const el = document.elementFromPoint(x, y);
              points.push({
                x, y,
                tagName: el ? el.tagName : null,
                className: el ? el.className : null,
                id: el ? el.id : null,
                text: el ? el.innerText.slice(0, 30) : null
              });
            }
          }

          const slide1 = document.querySelectorAll('.hero-carousel-slide')[1];
          const allInsideSlide1 = Array.from(slide1.querySelectorAll('*')).map(el => {
            const rect = el.getBoundingClientRect();
            const cs = window.getComputedStyle(el);
            return {
              tag: el.tagName,
              cls: el.className,
              rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
              display: cs.display,
              visibility: cs.visibility,
              opacity: cs.opacity,
              color: cs.color,
              background: cs.backgroundColor
            };
          });

          return JSON.stringify({ points, allInsideSlide1 }, null, 2);
        })()`
      });

      console.log('INSPECTION:', inspection.result.value);

      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1200);
