const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--window-size=375,812',
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

      const widths = [320, 360, 375, 390, 414, 480, 768, 991];
      console.log('--- TESTING ALL MOBILE VIEWPORT WIDTHS ---');

      for (const w of widths) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: w,
          height: 800,
          deviceScaleFactor: 2,
          mobile: true
        });

        await send('Page.navigate', { url: 'http://localhost:3000/' });
        
        // Wait for preloader dismissal
        await new Promise(r => setTimeout(r, 1200));

        const res = await send('Runtime.evaluate', {
          expression: `(() => {
            const docEl = document.documentElement;
            const b = document.body;
            const header = document.querySelector('.main-header');
            const mobileBar = document.querySelector('.mobile-header-bar');
            const searchRow = document.querySelector('.mobile-search-row');
            const logo = document.querySelector('.mobile-brand-logo-img');
            const hamburger = document.querySelector('.hamburger-btn');
            const cartBtn = document.querySelector('.mobile-header-action-btn');
            
            const rHeader = header ? header.getBoundingClientRect() : null;
            const rBar = mobileBar ? mobileBar.getBoundingClientRect() : null;
            const rSearch = searchRow ? searchRow.getBoundingClientRect() : null;
            
            const hasHOverflow = docEl.scrollWidth > window.innerWidth || b.scrollWidth > window.innerWidth;
            
            return {
              width: window.innerWidth,
              hOverflow: hasHOverflow,
              docScrollWidth: docEl.scrollWidth,
              headerVisible: rHeader && rHeader.height > 0 && window.getComputedStyle(header).display !== 'none',
              headerSticky: window.getComputedStyle(header).position.includes('sticky'),
              mobileBarVisible: rBar && rBar.height > 0 && window.getComputedStyle(mobileBar).display === 'flex',
              searchRowVisible: rSearch && rSearch.height > 0 && window.getComputedStyle(searchRow).display === 'block',
              headerRect: rHeader ? { width: rHeader.width, height: rHeader.height } : null
            };
          })()`,
          returnByValue: true
        });

        console.log(`Width ${w}px:`, JSON.stringify(res.result.value));
      }

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
