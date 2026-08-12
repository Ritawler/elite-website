// Server-only. Renders HTML to a PDF using a real browser engine (headless
// Chromium) rather than a client-side PDF library — the only reliable way
// to get correct Arabic shaping/RTL layout, since it's the same rendering
// engine a browser uses, not a hand-rolled text layout attempt.
//
// Locally we use the full `puppeteer` package (bundles its own Chrome).
// On Vercel we use `puppeteer-core` + `@sparticuz/chromium-min`, which
// downloads the Chromium binary at runtime from a CDN — avoiding the ~50 MB
// bundle size that makes full @sparticuz/chromium exceed Vercel's function limit.
import fs from "fs";
import path from "path";

let cachedFontBase64 = null;

export function getCairoFontBase64() {
  if (!cachedFontBase64) {
    const fontPath = path.join(process.cwd(), "src", "fonts", "Cairo-Variable.ttf");
    cachedFontBase64 = fs.readFileSync(fontPath).toString("base64");
  }
  return cachedFontBase64;
}

const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar";

export async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteer = await import("puppeteer-core");
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
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

// Renders a full, self-contained HTML document to a PDF sized exactly to
// `width`x`height` pixels with zero margins — used for certificates.
//
// Critical: Puppeteer's PDF renderer applies a minimum print margin even when
// margin:{0} is set, which clips the top of the page. The fix is to:
//   1. Declare `@page { size: Wpx Hpx; margin: 0; }` inside the HTML's <style>
//      (certificate.js already injects this via the `pageSize` CSS block below).
//   2. Use `preferCSSPageSize: true` so Puppeteer honours the CSS @page rule
//      instead of its own width/height computation.
export async function renderFixedSizeHtmlToPdf(fullHtml, { width, height }) {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    // A4 landscape in pixels at 96 dpi (297mm × 210mm)
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 1 });
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "297mm",
      height: "210mm",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
