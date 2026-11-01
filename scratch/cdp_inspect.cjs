const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--disable-gpu',
  '--window-size=375,812',
  '--user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9223/json', res => {
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
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true
      });

      console.log('Navigating to http://localhost:3000/ ...');
      await send('Page.navigate', { url: 'http://localhost:3000/' });

      // Wait 3.5s for preloader to dismiss and page to stabilize
      await new Promise(r => setTimeout(r, 3500));

      // Inspect elements at top
      const evalTop = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.main-header');
          const mobileBar = document.querySelector('.mobile-header-bar');
          const searchRow = document.querySelector('.mobile-search-row');
          const ann = document.querySelector('.announcement-bar');
          const hero = document.querySelector('.hero-carousel-wrap');
          
          function getInfo(el) {
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              display: cs.display,
              position: cs.position,
              top: cs.top,
              height: cs.height,
              width: cs.width,
              zIndex: cs.zIndex,
              rect: { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom }
            };
          }

          return {
            windowInner: { width: window.innerWidth, height: window.innerHeight },
            body: { scrollWidth: document.body.scrollWidth, clientWidth: document.body.clientWidth },
            header: getInfo(header),
            mobileBar: getInfo(mobileBar),
            searchRow: getInfo(searchRow),
            ann: getInfo(ann),
            hero: getInfo(hero)
          };
        })()`,
        returnByValue: true
      });

      console.log('INITIAL AT TOP:', JSON.stringify(evalTop.result.value, null, 2));

      // Take screenshot at top
      const shot1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_top.png'), Buffer.from(shot1.data, 'base64'));

      // Now scroll by 250px
      await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, 250)`
      });
      await new Promise(r => setTimeout(r, 500));

      const evalScrolled = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.main-header');
          const mobileBar = document.querySelector('.mobile-header-bar');
          const searchRow = document.querySelector('.mobile-search-row');
          const r = header ? header.getBoundingClientRect() : null;
          return {
            scrollY: window.scrollY,
            headerRect: r ? { top: r.top, bottom: r.bottom, height: r.height, left: r.left } : null
          };
        })()`,
        returnByValue: true
      });

      console.log('SCROLLED (250px):', JSON.stringify(evalScrolled.result.value, null, 2));

      // Take screenshot scrolled
      const shot2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_scrolled.png'), Buffer.from(shot2.data, 'base64'));

      console.log('Screenshots saved: shot_top.png and shot_scrolled.png');

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
