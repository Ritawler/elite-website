// Server-only. Builds a course-completion certificate PDF by overlaying
// text on one of two pre-designed template images (picked by the student's
// gender), using the same Puppeteer/Cairo-font pipeline as lib/pdf.js — see
// that file for why (correct Arabic RTL shaping, no extra PDF-text libs).
//
// Coordinates below were calibrated visually against real generated
// certificates on the actual 2000x1414 template. Note the "تقديم: ، يوم"
// baked phrase is contiguous with no gap, so the trainer name sits in the
// open slot to the left rather than immediately after "تقديم:".
import fs from "fs";
import path from "path";
import { getCairoFontBase64, renderFixedSizeHtmlToPdf } from "@/lib/pdf";

const TEMPLATE_WIDTH = 2000;
const TEMPLATE_HEIGHT = 1414;

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const templateCache = {};

function getTemplateBase64(gender) {
  const file = gender === "female" ? "female_template.png" : "male_template.png";
  if (!templateCache[file]) {
    const templatePath = path.join(process.cwd(), "public", "certificate-templates", file);
    templateCache[file] = fs.readFileSync(templatePath).toString("base64");
  }
  return templateCache[file];
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

export async function generateCertificatePdf({
  studentName,
  courseName,
  trainerName,
  trainerSignatureUrl,
  gender,
}) {
  const fontBase64 = getCairoFontBase64();
  const templateBase64 = getTemplateBase64(gender);

  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const dateText = `${now.getDate()} / ${now.getMonth() + 1} / ${now.getFullYear()}`;

  const html = `
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
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: ${TEMPLATE_WIDTH}px; height: ${TEMPLATE_HEIGHT}px; }
          .cert {
            position: relative;
            width: ${TEMPLATE_WIDTH}px;
            height: ${TEMPLATE_HEIGHT}px;
            background: url(data:image/png;base64,${templateBase64}) no-repeat;
            background-size: ${TEMPLATE_WIDTH}px ${TEMPLATE_HEIGHT}px;
            font-family: 'Cairo', sans-serif;
            color: #1a1a1a;
          }
          .field {
            position: absolute;
            font-weight: 700;
            white-space: nowrap;
            direction: rtl;
            text-align: right;
          }
          .student-name { top: 610px; right: 660px; font-size: 46px; }
          .course-name { top: 728px; right: 1140px; font-size: 26px; }
          .trainer-name { top: 814px; right: 1400px; font-size: 21px; }
          .day-name { top: 814px; right: 1170px; font-size: 21px; }
          .date-text { top: 868px; right: 1150px; font-size: 34px; }
          .signature { position: absolute; top: 1130px; right: 130px; height: 110px; }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="field student-name">${escapeHtml(studentName)}</div>
          <div class="field course-name">${escapeHtml(courseName)}</div>
          <div class="field trainer-name">${escapeHtml(trainerName)}</div>
          <div class="field day-name">${dayName}</div>
          <div class="field date-text">${dateText}</div>
          ${trainerSignatureUrl ? `<img class="signature" src="${escapeHtml(trainerSignatureUrl)}" />` : ""}
        </div>
      </body>
    </html>
  `;

  return renderFixedSizeHtmlToPdf(html, { width: TEMPLATE_WIDTH, height: TEMPLATE_HEIGHT });
}
