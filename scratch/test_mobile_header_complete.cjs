const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9224',
  '--disable-gpu',
  '--window-size=375,812',
  '--user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9224/json', res => {
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

      // Scroll to 0 just in case
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0)` });
      await new Promise(r => setTimeout(r, 300));

      // 1. Capture top of page
      const shotTop = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_top_ready.png'), Buffer.from(shotTop.data, 'base64'));
      console.log('Saved shot_top_ready.png');

      // 2. Scroll to 200px
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, 200)` });
      await new Promise(r => setTimeout(r, 400));
      const shotScrolled = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_scrolled_ready.png'), Buffer.from(shotScrolled.data, 'base64'));
      console.log('Saved shot_scrolled_ready.png');

      // 3. Click hamburger button to open drawer
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('.hamburger-btn');
          if (btn) btn.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 500));
      const shotDrawer = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'shot_drawer_ready.png'), Buffer.from(shotDrawer.data, 'base64'));
      console.log('Saved shot_drawer_ready.png');

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
