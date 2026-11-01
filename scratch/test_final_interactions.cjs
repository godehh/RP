const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--disable-gpu',
  '--window-size=375,812',
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
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true
      });

      console.log('Testing Index Page Mobile Header Interactions...');
      await send('Page.navigate', { url: 'http://localhost:3000/' });
      await new Promise(r => setTimeout(r, 1200));

      const testRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const results = [];
          
          // Test 1: Header visibility and stickiness
          const header = document.querySelector('.main-header');
          const mobileBar = document.querySelector('.mobile-header-bar');
          const searchRow = document.querySelector('.mobile-search-row');
          results.push({
            name: 'Header & Bar Visible',
            pass: !!header && !!mobileBar && window.getComputedStyle(mobileBar).display === 'flex'
          });

          // Test 2: Sticky behavior
          window.scrollTo(0, 300);
          const rScrolled = header.getBoundingClientRect();
          results.push({
            name: 'Sticky Header at Top:0 when scrolled',
            pass: rScrolled.top === 0 && rScrolled.height > 0
          });

          // Test 3: Hamburger Drawer Click
          const hamburger = document.querySelector('.hamburger-btn');
          const drawer = document.querySelector('.mobile-nav-drawer');
          hamburger.click();
          const drawerActive = drawer.classList.contains('active') && window.getComputedStyle(drawer).visibility === 'visible';
          results.push({
            name: 'Drawer Opens on Hamburger Click',
            pass: drawerActive
          });

          // Test 4: Accordion toggle
          const catToggle = document.querySelector('.mobile-categories-toggle');
          const acc = document.querySelector('.mobile-categories-accordion');
          catToggle.click();
          const accOpen = acc.classList.contains('open') && window.getComputedStyle(acc).display !== 'none';
          results.push({
            name: 'Category Accordion Expands on Tap',
            pass: accOpen
          });

          // Test 5: Drawer Close
          const closeBtn = document.querySelector('.mobile-drawer-close');
          closeBtn.click();
          const drawerClosed = !drawer.classList.contains('active') && window.getComputedStyle(drawer).visibility !== 'visible';
          results.push({
            name: 'Drawer Closes on Close Button Click',
            pass: drawerClosed
          });

          return results;
        })()`,
        returnByValue: true
      });

      console.log('Results:', JSON.stringify(testRes.result.value, null, 2));

      // Test Shop Page
      console.log('\nTesting Shop Page Mobile Header...');
      await send('Page.navigate', { url: 'http://localhost:3000/shop.html' });
      await new Promise(r => setTimeout(r, 1200));

      const shopRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.main-header');
          const mobileBar = document.querySelector('.mobile-header-bar');
          const searchRow = document.querySelector('.mobile-search-row');
          return {
            headerVisible: !!header && window.getComputedStyle(header).display !== 'none',
            mobileBarVisible: !!mobileBar && window.getComputedStyle(mobileBar).display === 'flex',
            searchRowVisible: !!searchRow && window.getComputedStyle(searchRow).display === 'block'
          };
        })()`,
        returnByValue: true
      });

      console.log('Shop Page Header Results:', JSON.stringify(shopRes.result.value, null, 2));

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
