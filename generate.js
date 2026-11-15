// generate.js v4.0 - Parameterized & Robust
const fs = require('fs');
const puppeteer = require('puppeteer');

const TARGET_URL = process.argv[2] || 'https://asciipro.net';
const JOB_ID = process.argv[3] || 'unknown';

console.log(`[INFO] Job: ${JOB_ID} | Target: ${TARGET_URL}`);

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('[INFO] Sayfa yükleniyor...');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // A3 PDF
    await page.pdf({
      path: 'content_A3.pdf',
      format: 'A3',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
    });

    // TSV Links
    const links = await page.evaluate(() => 
      Array.from(document.querySelectorAll('a')).map(a => {
        try {
          const u = new URL(a.href);
          return `${u.hostname}${u.pathname}\t${a.innerText.trim()}`;
        } catch(e) { return null; }
      }).filter(l => l && l.split('\t')[1]?.length > 0)
    );
    
    fs.writeFileSync('links.tsv', "PATH\tTEXT\n" + links.join("\n"));
    console.log(`[BAŞARILI] ${links.length} link | A3 PDF hazır`);

  } catch (err) {
    console.error(`[KRİTİK] ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
