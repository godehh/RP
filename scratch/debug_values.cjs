const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9228',
  '--disable-gpu',
  '--window-size=375,812',
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
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true
      });

      await send('Page.navigate', { url: 'http://localhost:3000/' });
      await new Promise(r => setTimeout(r, 1500));

      const debugRes = await send('Runtime.evaluate', {
        expression: `(() => {
          try {
            const header = document.querySelector('.main-header');
            const hamburger = document.querySelector('.hamburger-btn');
            const drawer = document.querySelector('.mobile-nav-drawer');

            if (!header) return { error: 'header not found' };
            if (!hamburger) return { error: 'hamburger not found' };
            if (!drawer) return { error: 'drawer not found' };

            const beforeScrollY = window.scrollY;
            window.scrollTo(0, 300);
            const afterScrollY = window.scrollY;
            const headerRectAfterScroll = header.getBoundingClientRect();
            const csHeader = window.getComputedStyle(header);

            const drawerClassesBefore = drawer.className;
            hamburger.click();
            const drawerClassesAfter = drawer.className;
            const drawerVisibility = window.getComputedStyle(drawer).visibility;

            return {
              beforeScrollY,
              afterScrollY,
              headerRectAfterScroll: {
                top: headerRectAfterScroll.top,
                bottom: headerRectAfterScroll.bottom,
                height: headerRectAfterScroll.height,
                width: headerRectAfterScroll.width
              },
              headerPosition: csHeader.position,
              headerTop: csHeader.top,
              drawerClassesBefore,
              drawerClassesAfter,
              drawerVisibility
            };
          } catch (e) {
            return { error: e.message, stack: e.stack };
          }
        })()`,
        returnByValue: true
      });

      console.log('DEBUG DETAILS:', JSON.stringify(debugRes.result.value, null, 2));

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
