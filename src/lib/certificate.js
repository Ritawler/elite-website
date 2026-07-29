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

  // Student name box: 600px–1425px from left (825px wide). Auto-shrink for >33 chars.
  const nameFontSize = Math.max(28, Math.min(46, Math.floor(1518 / Math.max(studentName.length, 33))));
  // Course name box: 600px–1050px from left (450px wide). Base 32px.
  const courseNameFontSize = Math.max(20, Math.min(32, Math.floor(818 / Math.max(courseName.length, 26))));
  // Trainer name box: 1050px–1850px from left (800px wide). Auto-shrink for >56 chars.
  // Trainer name box: 880px–1240px from left (360px wide). Auto-shrink for >25 chars.
  const trainerNameFontSize = Math.max(18, Math.min(26, Math.floor(655 / Math.max(trainerName.length, 26))));

  const html = buildHtml({ fontBase64, templateBase64, studentName, courseName, trainerName, trainerSignatureUrl, dayName, dateText, nameFontSize, courseNameFontSize, trainerNameFontSize });
  return renderFixedSizeHtmlToPdf(html, { width: TEMPLATE_WIDTH, height: TEMPLATE_HEIGHT });
}

function buildHtml({ fontBase64, templateBase64, studentName, courseName, trainerName, trainerSignatureUrl, dayName, dateText, nameFontSize, courseNameFontSize, trainerNameFontSize }) {
  return `
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
          /* RTL layout: left+right sets the box; text-align controls position within it.
             Trainer name: 880–1240px (between "،" right-edge and "تقديم:" left-edge).
             Day name: 50–690px (left of "يوم" left-edge). */
          .student-name { top: 610px; left: 600px; right: 575px; text-align: center; font-size: ${nameFontSize}px; }
          .course-name  { top: 728px; left: 600px; right: 950px; text-align: center; font-size: ${courseNameFontSize}px; }
          .trainer-name { top: 814px; left: 880px; right: 760px; text-align: right; overflow: hidden; font-size: ${trainerNameFontSize}px; }
          .day-name     { top: 814px; left: 50px; right: 1310px; text-align: right; overflow: hidden; font-size: 26px; }
          .date-text    { top: 868px; left: 200px; right: 1150px; font-size: 34px; }
          .signature    { position: absolute; top: 1130px; right: 130px; height: 110px; }
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
}
