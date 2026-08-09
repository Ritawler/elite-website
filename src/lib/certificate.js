// Server-only. Certificate overlay — text + assets rendered over PNG template via Puppeteer.
// Template space: 2000×1414 px. Viewport: 1123×794 (A4 landscape at 96 dpi).
// All coordinates authored in template space, scaled by S = 1123/2000.
import { readFileSync, existsSync } from "fs";
import { join }                      from "path";
import { getCairoFontBase64, renderFixedSizeHtmlToPdf } from "@/lib/pdf";

const esc = s => String(s ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const toEn = s => String(s).replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660);

function loadTemplate(name) {
  const p = join(process.cwd(), "public", "certificate-templates", name);
  if (!existsSync(p)) return null;
  try { return `data:image/png;base64,${readFileSync(p).toString("base64")}`; }
  catch { return null; }
}

async function asset(name) {
  const p = join(process.cwd(), "public", "certificate-assets", name);
  if (!existsSync(p)) return null;
  try {
    const sharp = (await import("sharp")).default;
    const src = readFileSync(p);
    const { data, info } = await sharp(src)
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = new Uint8Array(data);
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i+1], b = px[i+2];
      if (r > 220 && g > 220 && b > 220) px[i+3] = 0;
    }
    const out = await sharp(Buffer.from(px), {
      raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer();
    return `data:image/png;base64,${out.toString("base64")}`;
  } catch {
    return `data:image/png;base64,${readFileSync(p).toString("base64")}`;
  }
}

export async function generateCertificatePdf({
  studentName, courseName, trainerName, dayName,
  dateText, gender,
}) {
  const [font, stamp, adminSig, medal] = await Promise.all([
    getCairoFontBase64(),
    asset("stamp.png"),
    asset("admin-signature.png"),
    asset("medal.png"),
  ]);
  const tpl = loadTemplate("new_template.png");

  const honorific     = gender === "female" ? "الأستاذة:" : "الأستاذ:";
  const completedVerb = gender === "female" ? "أتمت دورة" : "أتم دورة";

  return renderFixedSizeHtmlToPdf(
    buildHtml({ font, tpl, stamp, adminSig, medal,
                studentName, courseName, trainerName, dayName,
                dateEnglish: toEn(dateText ?? ""), honorific, completedVerb }),
    { width: 1123, height: 794 }
  );
}

/* ─────────────────── layout plan (template 2000×1414 space) ───────────────────
   Safe area inside gray border:  x [115 → 1885],  y [105 → 1310]
   Total usable height: 1205 px

   TEXT ZONE   y 135 → 910   (content + even gaps fill this band)
   HR DIVIDER  y 930
   IMAGE ZONE  y 955 → 1280

   Text elements + approximate heights:
     Title     100px font → ~115px
     Intro      41px font →  ~55px
     Name row   60–90px  → ~105px
     Course     43–76px  →  ~90px
     Trainer    40px     →  ~52px
     Date       40px     →  ~52px
   Sum of heights: ~469px
   Available (135→910): 775px  →  gaps = (775-469)/5 ≈ 61px between elements

   Image zone (y 955→1280, height 325px):
     LEFT:  nothing (template has decorative corner there)
     CENTER: medal h=252 (y 955→1207) + "ELITE COMPANY" (y 1225, font 46px)
     RIGHT:  stamp+sig wrapper h=280 (y 955→1235) + "توقيع الإدارة" (y 1253)
             inside wrapper: stamp top=0 h=220, sig bottom=0 h=130 → 70px overlap
────────────────────────────────────────────────────────────────────────────── */
function buildHtml({
  font, tpl, stamp, adminSig, medal,
  studentName, courseName, trainerName, dayName, dateEnglish,
  honorific, completedVerb,
}) {
  const S = 1123 / 2000;
  const p = n => Math.round(n * S);

  // Dynamic font sizes (template space units)
  const nameFt  = Math.max(62, Math.min(90,  Math.floor(4600 / Math.max(studentName.length, 34))));
  const crseFt  = Math.max(50, Math.min(76,  Math.floor(3800 / Math.max(courseName.length,  38))));

  // Y positions (template space)
  const Y_TITLE   = 135;
  const Y_INTRO   = 135 + 115 + 61;   // 311
  const Y_NAME    = 311 +  55 + 61;   // 427
  const Y_COURSE  = 427 + 105 + 61;   // 593
  const Y_TRAINER = 593 +  90 + 61;   // 744
  const Y_DATE    = 744 +  52 + 61;   // 857  (bottom ≈ 909, close to 910 ✓)
  const Y_HR      = 930;
  const Y_IMG     = 955;

  // Stamp+sig wrapper: height 285, right 80 from edge, width 290
  const WRAP_H   = 285;
  const WRAP_W   = 290;
  const WRAP_R   = 80;    // distance from right edge of template
  const Y_SIG_LBL = Y_IMG + WRAP_H + 18;  // "توقيع الإدارة" label

  // Medal: center, height 252
  const MEDAL_H  = 252;
  const Y_ELITE  = Y_IMG + MEDAL_H + 18;  // "ELITE COMPANY" label

  const bg = tpl ? `url("${tpl}")` : `#f3f3f0`;

  // Stamp+sig wrapper HTML (stamp overlaps sig at 85% opacity)
  const sigInner   = adminSig
    ? `<img src="${adminSig}"
           style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                  height:${p(130)}px;width:auto;object-fit:contain;z-index:1;"/>`
    : ``;
  const stampInner = stamp
    ? `<img src="${stamp}"
           style="position:absolute;top:0;left:50%;transform:translateX(-50%);
                  height:${p(220)}px;width:auto;object-fit:contain;
                  opacity:0.85;z-index:2;"/>`
    : ``;

  const medalEl = medal
    ? `<img src="${medal}"
         style="position:absolute;left:50%;transform:translateX(-50%);
                top:${p(Y_IMG)}px;height:${p(MEDAL_H)}px;
                width:auto;object-fit:contain;"/>`
    : ``;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700;900&display=swap" rel="stylesheet">
<style>
@font-face{
  font-family:'Cairo';
  src:url(data:font/ttf;base64,${font}) format('truetype');
  font-weight:100 1000;
}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{
  width:1123px;height:794px;margin:0;padding:0;
  overflow:hidden;font-family:'Cairo',sans-serif;
}
.cert{
  position:relative;width:1123px;height:794px;
  background:${bg} no-repeat center/cover;
  overflow:hidden;
}
.row{position:absolute;left:0;right:0;text-align:center;line-height:1.25;}
</style>
</head>
<body>
<div class="cert">

  <!-- ① Title -->
  <div class="row" style="
    top:${p(Y_TITLE)}px;
    font-family:'Noto Naskh Arabic','Cairo',sans-serif;
    font-size:${p(100)}px;font-weight:900;color:#2C5F8A;letter-spacing:1px;">
    شهادة إتمام
  </div>

  <!-- ② Intro -->
  <div class="row" style="
    top:${p(Y_INTRO)}px;
    font-size:${p(41)}px;color:#444;">
    تشهد شركة ELITE للبحث والتطوير التجريبي في علم النفس بأن
  </div>

  <!-- ③ Honorific + Student name -->
  <div style="
    position:absolute;top:${p(Y_NAME)}px;left:0;right:0;
    display:flex;justify-content:center;align-items:baseline;
    direction:rtl;gap:${p(22)}px;">
    <span style="color:#4B96CE;font-size:${p(60)}px;font-weight:700;white-space:nowrap;">
      ${esc(honorific)}
    </span>
    <span style="color:#1a1a2e;font-size:${p(nameFt)}px;font-weight:900;white-space:nowrap;">
      ${esc(studentName)}
    </span>
  </div>

  <!-- ④ Course -->
  <div class="row" style="
    top:${p(Y_COURSE)}px;
    font-size:${p(43)}px;color:#333;">
    ${esc(completedVerb)}&ensp;<span style="color:#2C5F8A;font-size:${p(crseFt)}px;font-weight:800;">
      ${esc(courseName)}
    </span>
  </div>

  <!-- ⑤ Trainer + Day -->
  <div class="row" style="
    top:${p(Y_TRAINER)}px;
    font-size:${p(40)}px;color:#555;">
    تقديم:&ensp;<strong style="color:#333;">${esc(trainerName)}</strong>&emsp;،&ensp;يوم ${esc(dayName)}
  </div>

  <!-- ⑥ Date -->
  <div class="row" style="
    top:${p(Y_DATE)}px;
    font-size:${p(40)}px;color:#555;">
    الموافق:&ensp;<strong style="color:#333;">${esc(dateEnglish)}</strong>
  </div>

  <!-- ⑦ Horizontal divider -->
  <div style="
    position:absolute;top:${p(Y_HR)}px;
    left:${p(130)}px;right:${p(130)}px;
    height:1px;background:rgba(75,150,206,0.25);"></div>

  <!-- ⑧ Medal — center -->
  ${medalEl}

  <!-- ⑨ "ELITE COMPANY" — below medal -->
  <div class="row" style="
    top:${p(Y_ELITE)}px;
    font-size:${p(46)}px;font-weight:900;color:#4B96CE;letter-spacing:3px;">
    ELITE COMPANY
  </div>

  <!-- ⑩ Stamp + Sig wrapper — right column
       Stamp (z-index:2, opacity:0.85) overlaps Sig (z-index:1) by ~70px -->
  <div style="
    position:absolute;
    top:${p(Y_IMG)}px;right:${p(WRAP_R)}px;
    width:${p(WRAP_W)}px;height:${p(WRAP_H)}px;">
    ${sigInner}
    ${stampInner}
  </div>

  <!-- ⑪ "توقيع الإدارة" — below stamp+sig wrapper -->
  <div style="
    position:absolute;
    top:${p(Y_SIG_LBL) - 10}px;right:${p(WRAP_R) + 15}px;
    width:${p(WRAP_W)}px;text-align:center;
    font-size:${p(40)}px;color:#555;">
    توقيع الإدارة
  </div>

</div>
</body>
</html>`;
}
