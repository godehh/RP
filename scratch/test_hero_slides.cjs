const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--disable-gpu',
  '--window-size=400,800',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9227/json', res => {
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

      console.log('Navigating to http://localhost:3000');
      await send('Page.navigate', { url: 'http://localhost:3000' });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        const res = await send('Runtime.evaluate', {
          expression: `!document.getElementById('rp-preloader') || window.getComputedStyle(document.getElementById('rp-preloader')).opacity === '0'`
        });
        if (res.result && res.result.value) break;
      }
      await new Promise(r => setTimeout(r, 600));

      // Inspect slides
      const debugInfo = await send('Runtime.evaluate', {
        expression: `(() => {
          const slides = Array.from(document.querySelectorAll('.hero-carousel-slide'));
          const track = document.querySelector('.hero-carousel-track');
          const wrap = document.querySelector('.hero-carousel-wrap');
          return JSON.stringify({
            trackRect: track ? track.getBoundingClientRect() : null,
            trackTransform: track ? track.style.transform : null,
            trackComputedTransform: track ? window.getComputedStyle(track).transform : null,
            wrapRect: wrap ? wrap.getBoundingClientRect() : null,
            slides: slides.map((s, idx) => {
              const panel = s.querySelector('.hero-slide-panel');
              const left = s.querySelector('.hero-slide-content-left');
              const right = s.querySelector('.hero-slide-image-right');
              const bounce = s.querySelector('.bounce-cards');
              const title = s.querySelector('.hero-product-title');
              return {
                idx,
                classList: Array.from(s.classList),
                slideRect: s.getBoundingClientRect(),
                panelRect: panel ? panel.getBoundingClientRect() : null,
                panelDisplay: panel ? window.getComputedStyle(panel).display : null,
                leftRect: left ? left.getBoundingClientRect() : null,
                leftOpacity: left ? window.getComputedStyle(left).opacity : null,
                rightRect: right ? right.getBoundingClientRect() : null,
                rightOpacity: right ? window.getComputedStyle(right).opacity : null,
                titleText: title ? title.innerText.trim() : null,
                bounceCards: bounce ? bounce.children.length : null
              };
            })
          }, null, 2);
        })()`
      });

      console.log('INITIAL STATE (Slide 0):', debugInfo.result.value);

      let shot0 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'hero_slide_0.png'), Buffer.from(shot0.data, 'base64'));

      // Click dot 2 (index 1)
      await send('Runtime.evaluate', {
        expression: `(() => {
          const dots = document.querySelectorAll('.hero-dot');
          if (dots[1]) dots[1].click();
        })()`
      });
      await new Promise(r => setTimeout(r, 1000));

      const debugSlide1 = await send('Runtime.evaluate', {
        expression: `(() => {
          const track = document.querySelector('.hero-carousel-track');
          const slides = Array.from(document.querySelectorAll('.hero-carousel-slide'));
          return JSON.stringify({
            trackTransform: track ? track.style.transform : null,
            trackComputedTransform: track ? window.getComputedStyle(track).transform : null,
            slides: slides.map((s, idx) => ({
              idx,
              classList: Array.from(s.classList),
              slideRect: s.getBoundingClientRect(),
              leftOpacity: s.querySelector('.hero-slide-content-left') ? window.getComputedStyle(s.querySelector('.hero-slide-content-left')).opacity : null,
              rightOpacity: s.querySelector('.hero-slide-image-right') ? window.getComputedStyle(s.querySelector('.hero-slide-image-right')).opacity : null
            }))
          }, null, 2);
        })()`
      });
      console.log('SLIDE 1 STATE:', debugSlide1.result.value);

      let shot1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'hero_slide_1.png'), Buffer.from(shot1.data, 'base64'));

      // Click dot 3 (index 2)
      await send('Runtime.evaluate', {
        expression: `(() => {
          const dots = document.querySelectorAll('.hero-dot');
          if (dots[2]) dots[2].click();
        })()`
      });
      await new Promise(r => setTimeout(r, 1000));

      const debugSlide2 = await send('Runtime.evaluate', {
        expression: `(() => {
          const track = document.querySelector('.hero-carousel-track');
          const slides = Array.from(document.querySelectorAll('.hero-carousel-slide'));
          return JSON.stringify({
            trackTransform: track ? track.style.transform : null,
            trackComputedTransform: track ? window.getComputedStyle(track).transform : null,
            slides: slides.map((s, idx) => ({
              idx,
              classList: Array.from(s.classList),
              slideRect: s.getBoundingClientRect(),
              leftOpacity: s.querySelector('.hero-slide-content-left') ? window.getComputedStyle(s.querySelector('.hero-slide-content-left')).opacity : null,
              rightOpacity: s.querySelector('.hero-slide-image-right') ? window.getComputedStyle(s.querySelector('.hero-slide-image-right')).opacity : null
            }))
          }, null, 2);
        })()`
      });
      console.log('SLIDE 2 STATE:', debugSlide2.result.value);

      let shot2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, 'hero_slide_2.png'), Buffer.from(shot2.data, 'base64'));

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
