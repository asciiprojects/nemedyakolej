// generate.js - AsciiPro.net A3 PDF & TSV Üretici (No-Sandbox)
const fs = require('fs');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',           // GITHUB ACTIONS İÇİN ZORUNLU
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Paylaşılan bellek hatasını önler
      '--disable-gpu'           // Headless modda GPU çakışmasını engeller
    ]
  });

  const page = await browser.newPage();
  
  // ÜYELİK SİSTEMLERİNİ BYPASS ETMEK İÇİN HEADER'LAR
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  });

  // GOOGLE TRANSLATE DESTEĞİ İÇİN ÇEREZ YÖNETİMİ
  // Siteye gidip translate widget'ının yüklenmesini bekle
  await page.goto('https://asciipro.net', { 
    waitUntil: 'networkidle2', 
    timeout: 60000 
  });

  // Opsiyonel: Google Translate widget'ını manuel tetikleme (eğer otomatik açılmazsa)
  // await page.click('.goog-te-menu-value'); 

  // 1. A3 PDF ÜRETİMİ (Translate Aktif Haldeyken)
  await page.pdf({
    path: 'content_A3.pdf',
    format: 'A3',
    printBackground: true,
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
    preferCSSPageSize: true,
    landscape: false // A3 dikey, yatay istersen true yap
  });

  // 2. PROTOKOLSÜZ TSV LİNK HARİTASI
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => {
      try {
        const url = new URL(a.href);
        // Sadece hostname + pathname (http/https YOK)
        return `${url.hostname}${url.pathname}\t${a.innerText.trim()}`;
      } catch(e) { return null; }
    }).filter(l => l !== null && l.split('\t')[1].length > 0);
  });

  const tsvContent = "PATH\tTEXT\n" + links.join("\n");
  fs.writeFileSync('links.tsv', tsvContent);

  await browser.close();
  console.log('[BAŞARILI] AsciiPro.net A3 PDF ve TSV oluşturuldu.');
})();