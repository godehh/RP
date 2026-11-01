const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9234',
  '--disable-gpu',
  '--window-size=390,844',
  '--user-agent="Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36"',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9234/json', res => {
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
        deviceScaleFactor: 2.75,
        mobile: true
      });

      console.log('Navigating to http://localhost:3000/product.html?id=spices-poondu ...');
      await send('Page.navigate', { url: 'http://localhost:3000/product.html?id=spices-poondu' });
      
      // Wait for #detail-main-img
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 100));
        const chk = await send('Runtime.evaluate', {
          expression: `!!document.getElementById('detail-main-img')`
        });
        if (chk.result && chk.result.value) break;
      }
      await new Promise(r => setTimeout(r, 600));

      // 1. Initial State Screenshot (scroll 0)
      const shot1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'pdp_fixed_initial.png'), Buffer.from(shot1.data, 'base64'));
      console.log('Saved pdp_fixed_initial.png');

      // 2. Metrics at scroll 0
      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const docEl = document.documentElement;
          const b = document.body;
          const header = document.querySelector('.main-header');
          const mainView = document.querySelector('.product-main-view');
          const mainImg = document.getElementById('detail-main-img');
          const title = document.querySelector('.product-main-title');
          const priceBox = document.querySelector('.product-price-box');
          const options = document.querySelector('.product-option-section');
          const stickyBar = document.querySelector('.sticky-add-cart-bar');
          
          function r(el) {
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height), width: Math.round(rect.width) };
          }

          return {
            window: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
            hasHorizontalOverflow: docEl.scrollWidth > window.innerWidth || b.scrollWidth > window.innerWidth,
            header: r(header),
            mainView: r(mainView),
            mainImg: mainImg ? { width: mainImg.clientWidth, height: mainImg.clientHeight, naturalW: mainImg.naturalWidth, naturalH: mainImg.naturalHeight } : null,
            title: r(title),
            priceBox: r(priceBox),
            options: r(options),
            stickyBarVisibleAtTop: stickyBar ? stickyBar.classList.contains('is-visible') : false
          };
        })()`,
        returnByValue: true
      });

      console.log('NEW METRICS (at scroll 0):', JSON.stringify(metrics.result.value, null, 2));

      // 3. Scroll down 450px
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, 450)` });
      await new Promise(r => setTimeout(r, 400));

      const shot2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'pdp_fixed_scrolled.png'), Buffer.from(shot2.data, 'base64'));
      console.log('Saved pdp_fixed_scrolled.png');

      const scrolledMetrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const stickyBar = document.querySelector('.sticky-add-cart-bar');
          return {
            scrollY: window.scrollY,
            stickyBarVisibleAfterScroll: stickyBar ? stickyBar.classList.contains('is-visible') : false
          };
        })()`,
        returnByValue: true
      });
      console.log('SCROLLED METRICS:', JSON.stringify(scrolledMetrics.result.value, null, 2));

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
