// Generate an A3 PDF and TSV link list for a publicly accessible page.
const fs = require('fs');
const net = require('net');
const puppeteer = require('puppeteer-core');

function getTargetUrl() {
  let value = (process.env.TARGET_URL || process.argv[2] || 'https://asciipro.net').trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http and https URLs are supported.');
  }
  if (url.username || url.password) {
    throw new Error('URLs containing credentials are not allowed.');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || net.isIP(url.hostname)) {
    throw new Error('Use a public hostname, not localhost or an IP address.');
  }
  return url.href;
}

(async () => {
  const targetUrl = getTargetUrl();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    if (!response || !response.ok()) {
      throw new Error(`Page load failed${response ? ` with HTTP ${response.status()}` : ''}.`);
    }

    await page.pdf({
      path: 'content_A3.pdf',
      format: 'A3',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
      preferCSSPageSize: true,
      landscape: false
    });

    const links = await page.evaluate(() => Array.from(document.querySelectorAll('a'))
      .map((anchor) => {
        try {
          const url = new URL(anchor.href);
          const text = anchor.innerText.trim();
          return text ? `${url.hostname}${url.pathname}\t${text}` : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean));

    fs.writeFileSync('links.tsv', `PATH\tTEXT\n${links.join('\n')}`);
    console.log(`Captured ${targetUrl}; generated content_A3.pdf and links.tsv.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
