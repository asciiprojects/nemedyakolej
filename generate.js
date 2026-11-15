// generate.js - Robust A3 PDF & TSV Generator v3.0
const fs = require('fs');
const puppeteer = require('puppeteer'); // core DEĞİL, tam sürüm (chromium dahil)

(async () => {
  console.log('[INFO] Browser başlatılıyor...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // /dev/shm yetersizliğini aşar
      '--disable-gpu',
      '--single-process'          // Bellek kullanımını düşürür
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Gerçekçi tarayıcı kimliği (Üyelik bypass + Translate desteği)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8' });

    console.log('[INFO] Sayfa yükleniyor: asciipro.net');
    await page.goto('https://asciipro.net', { 
      waitUntil: 'domcontentloaded', // networkidle0 çok katı, domcontentloaded daha güvenli
      timeout: 45000 
    });

    // 1. A3 PDF ÜRETİMİ
    console.log('[INFO] A3 PDF oluşturuluyor...');
    await page.pdf({
      path: 'content_A3.pdf',
      format: 'A3',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
    });

    // 2. PROTOKOLSÜZ TSV LİNK HARİTASI
    console.log('[INFO] Link haritası çıkarılıyor...');
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => {
        try {
          const url = new URL(a.href);
          return `${url.hostname}${url.pathname}\t${a.innerText.trim()}`;
        } catch(e) { return null; }
      }).filter(l => l !== null && l.split('\t')[1].length > 0);
    });

    fs.writeFileSync('links.tsv', "PATH\tTEXT\n" + links.join("\n"));
    console.log(`[BAŞARILI] ${links.length} link, A3 PDF hazır.`);

  } catch (err) {
    console.error('[KRİTİK HATA]', err.message);
    process.exit(1); // Hata varsa workflow'u açıkça başarısız yap
  } finally {
    await browser.close();
  }
})();
