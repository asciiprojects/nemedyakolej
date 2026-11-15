// generate.js v5.0 - Diagnostic + outer_text Output
const fs = require('fs');
const puppeteer = require('puppeteer');

const TARGET_URL = process.argv[2] || 'https://asciipro.net';
const JOB_ID = process.argv[3] || 'unknown';

console.log(`[INFO] Job: ${JOB_ID} | Target: ${TARGET_URL}`);

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('[INFO] Sayfa yükleniyor...');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // 1. OUTER_TEXT ÇIKAR (Frontend için)
    console.log('[INFO] outer_text çıkarılıyor...');
    const outerText = await page.evaluate(() => document.body?.innerText || '');
    fs.writeFileSync('outer_text.txt', outerText);
    console.log(`[INFO] outer_text boyutu: ${outerText.length} karakter`);

    // 2. A3 PDF
    console.log('[INFO] A3 PDF oluşturuluyor...');
    await page.pdf({
      path: 'content_A3.pdf',
      format: 'A3',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
    });

    // 3. TSV Links
    console.log('[INFO] Link haritası çıkarılıyor...');
    const links = await page.evaluate(() => 
      Array.from(document.querySelectorAll('a')).map(a => {
        try {
          const u = new URL(a.href);
          return `${u.hostname}${u.pathname}\t${a.innerText.trim()}`;
        } catch(e) { return null; }
      }).filter(l => l && l.split('\t')[1]?.length > 0)
    );
    fs.writeFileSync('links.tsv', "PATH\tTEXT\n" + links.join("\n"));

    console.log(`[BAŞARILI] ${links.length} link | A3 PDF | outer_text hazır`);

  } catch (err) {
    // HATA DETAYINI DOSYAYA YAZ (Debug için)
    const errorReport = {
      job_id: JOB_ID,
      url: TARGET_URL,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('error_report.json', JSON.stringify(errorReport, null, 2));
    console.error('[KRİTİK HATA]', err.message);
    console.error('[STACK]', err.stack);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
