const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.join(__dirname, 'mobile_screenshot.png');

console.log('Capturing mobile screenshot via headless chrome...');

const args = [
  '--headless=new',
  '--disable-gpu',
  '--window-size=375,812',
  '--hide-scrollbars',
  '--user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"',
  `--screenshot=${outputPath}`,
  'http://localhost:3000/'
];

const proc = spawn(chromePath, args);

proc.on('close', (code) => {
  console.log('Chrome finished with code:', code);
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log('Screenshot created successfully, size:', stats.size, 'bytes');
  } else {
    console.error('Screenshot file was NOT created!');
  }
});
