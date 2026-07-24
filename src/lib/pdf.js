// Server-only. Renders HTML to a PDF using a real browser engine (headless
// Chromium) rather than a client-side PDF library — the only reliable way
// to get correct Arabic shaping/RTL layout, since it's the same rendering
// engine a browser uses, not a hand-rolled text layout attempt.
//
// Locally we use the full `puppeteer` package (bundles its own Chrome).
// On Vercel we use `puppeteer-core` + `@sparticuz/chromium`, a Chromium
// build sized for serverless functions.
import fs from "fs";
import path from "path";

let cachedFontBase64 = null;

function getCairoFontBase64() {
  if (!cachedFontBase64) {
    const fontPath = path.join(process.cwd(), "src", "fonts", "Cairo-Variable.ttf");
    cachedFontBase64 = fs.readFileSync(fontPath).toString("base64");
  }
  return cachedFontBase64;
}

async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({ headless: true });
}

export async function renderHtmlToPdf(bodyHtml) {
  const fontBase64 = getCairoFontBase64();

  const document = `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {
            font-family: 'Cairo';
            src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
            font-weight: 100 1000;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
            color: #202B36;
          }
          p { margin: 0 0 0.6em; }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `;

  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(document, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
