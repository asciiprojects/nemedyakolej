// generate.js v5.2 - Unified JSON Output
const fs = require('fs');
const puppeteer = require('puppeteer');

const TARGET_URL = process.argv[2] || 'https://en.wikipedia.org/wiki/Grunge';
const JOB_ID = process.argv[3] || 'unknown';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 90000;

console.log(`[INFO] Job: ${JOB_ID} | Target: ${TARGET_URL}`);

async function loadWithRetry(page, url, retries) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[INFO] Deneme ${i}/${retries} | Timeout: ${TIMEOUT_MS}ms`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
      console.log('[INFO] Sayfa yüklendi.');
      return true;
    } catch (err) {
      console.warn(`[UYARI] Deneme ${i} başarısız: ${err.message.split('\n')[0]}`);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 5000 * i));
    }
  }
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
    
    await loadWithRetry(page, TARGET_URL, MAX_RETRIES);

    // outer_text çıkar
    const outerText = await page.evaluate(() => document.body?.innerText || '');
    
    // Link haritası
    const links = await page.evaluate(() => 
      Array.from(document.querySelectorAll('a')).map(a => {
        try {
          const u = new URL(a.href);
          return `${u.hostname}${u.pathname}\t${a.innerText.trim()}`;
        } catch(e) { return null; }
      }).filter(l => l && l.split('\t')[1]?.length > 0)
    );

    // A3 PDF
    await page.pdf({
      path: 'content_A3.pdf',
      format: 'A3',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
    });

    // TSV
    fs.writeFileSync('links.tsv', "PATH\tTEXT\n" + links.join("\n"));

    // ★ KRİTİK: Birleşik result.json (PHP'nin okuyacağı tek dosya)
    const resultJson = {
      job_id: JOB_ID,
      url: TARGET_URL,
      outer_text: outerText,
      link_count: links.length,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('result.json', JSON.stringify(resultJson, null, 2));

    console.log(`[BAŞARILI] ${outerText.length} char | ${links.length} link | A3 PDF | result.json`);

  } catch (err) {
    const errorReport = {
      job_id: JOB_ID,
      url: TARGET_URL,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('error_report.json', JSON.stringify(errorReport, null, 2));
    console.error('[KRİTİK HATA]', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
