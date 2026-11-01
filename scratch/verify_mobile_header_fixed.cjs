const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--window-size=375,812',
  '--user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9225/json', res => {
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

      console.log('Navigating to http://localhost:3000/?cachebust=' + Date.now());
      await send('Page.navigate', { url: 'http://localhost:3000/?cachebust=' + Date.now() });

      // Poll until preloader is gone
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        const res = await send('Runtime.evaluate', {
          expression: `!document.getElementById('rp-preloader') || window.getComputedStyle(document.getElementById('rp-preloader')).opacity === '0'`
        });
        if (res.result && res.result.value) {
          console.log(`Preloader dismissed at ${i * 200}ms`);
          break;
        }
      }

      await new Promise(r => setTimeout(r, 600));

      // Inspect Header metrics at scroll 0
      const metricsInitial = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.main-header');
          const mobileBar = document.querySelector('.mobile-header-bar');
          const searchRow = document.querySelector('.mobile-search-row');
          const heroTitle = document.querySelector('.hero-product-title');
          return JSON.stringify({
            headerPosition: window.getComputedStyle(header).position,
            headerTop: window.getComputedStyle(header).top,
            headerZIndex: window.getComputedStyle(header).zIndex,
            headerRect: header.getBoundingClientRect(),
            mobileBarDisplay: window.getComputedStyle(mobileBar).display,
            mobileBarRect: mobileBar.getBoundingClientRect(),
            searchRowDisplay: window.getComputedStyle(searchRow).display,
            searchRowRect: searchRow.getBoundingClientRect(),
            heroTitleRect: heroTitle.getBoundingClientRect(),
            bodyPaddingTop: window.getComputedStyle(document.body).paddingTop
          });
        })()`
      });
      console.log('INITIAL METRICS:\n', JSON.parse(metricsInitial.result.value));

      // 1. Capture initial screenshot
      const shotInitial = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_fixed_initial.png'), Buffer.from(shotInitial.data, 'base64'));
      console.log('Saved shot_fixed_initial.png');

      // 2. Scroll to 300px and re-inspect
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, 300)` });
      await new Promise(r => setTimeout(r, 400));

      const metricsScrolled = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.main-header');
          return JSON.stringify({
            scrollY: window.scrollY,
            headerRect: header.getBoundingClientRect()
          });
        })()`
      });
      console.log('SCROLLED 300px METRICS:\n', JSON.parse(metricsScrolled.result.value));

      const shotScrolled = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_fixed_scrolled.png'), Buffer.from(shotScrolled.data, 'base64'));
      console.log('Saved shot_fixed_scrolled.png');

      // 3. Click Hamburger to open drawer
      await send('Runtime.evaluate', {
        expression: `(() => {
          const hamburger = document.querySelector('.hamburger-btn');
          if (hamburger) hamburger.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 500));

      const shotDrawer = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_fixed_drawer.png'), Buffer.from(shotDrawer.data, 'base64'));
      console.log('Saved shot_fixed_drawer.png');

      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error('Error during execution:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1200);
