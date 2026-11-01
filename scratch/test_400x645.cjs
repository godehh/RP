const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--disable-gpu',
  '--window-size=400,645',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9226/json', res => {
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
        height: 645,
        deviceScaleFactor: 2,
        mobile: true
      });

      console.log('Navigating to http://localhost:3000/?v=400x645');
      await send('Page.navigate', { url: 'http://localhost:3000/?v=400x645' });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        const res = await send('Runtime.evaluate', {
          expression: `!document.getElementById('rp-preloader') || window.getComputedStyle(document.getElementById('rp-preloader')).opacity === '0'`
        });
        if (res.result && res.result.value) break;
      }
      await new Promise(r => setTimeout(r, 600));

      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.main-header');
          const mobileBar = document.querySelector('.mobile-header-bar');
          const searchRow = document.querySelector('.mobile-search-row');
          const heroPanel = document.querySelector('.hero-slide-panel');
          const heroTitle = document.querySelector('.hero-product-title');
          const heroBounce = document.querySelector('.hero-bounce-wrap');
          const bottomBar = document.querySelector('.mobile-bottom-bar');
          return JSON.stringify({
            header: header ? header.getBoundingClientRect() : null,
            mobileBar: mobileBar ? mobileBar.getBoundingClientRect() : null,
            searchRow: searchRow ? searchRow.getBoundingClientRect() : null,
            heroPanel: heroPanel ? heroPanel.getBoundingClientRect() : null,
            heroTitle: heroTitle ? heroTitle.getBoundingClientRect() : null,
            heroBounce: heroBounce ? heroBounce.getBoundingClientRect() : null,
            bottomBar: bottomBar ? bottomBar.getBoundingClientRect() : null,
            bodyPaddingTop: window.getComputedStyle(document.body).paddingTop,
            windowInner: { width: window.innerWidth, height: window.innerHeight }
          });
        })()`
      });

      console.log('METRICS AT 400x645:', JSON.parse(metrics.result.value));

      const shot0 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_400x645_top.png'), Buffer.from(shot0.data, 'base64'));

      await send('Runtime.evaluate', { expression: `window.scrollTo(0, 260)` });
      await new Promise(r => setTimeout(r, 400));
      const shotScrolled = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_400x645_scrolled.png'), Buffer.from(shotScrolled.data, 'base64'));

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
