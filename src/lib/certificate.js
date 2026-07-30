// Server-only. Fully coded certificate — HTML → PDF via Puppeteer + Cairo.
// Assets loaded from /public/certificate-assets/ at runtime (graceful fallback).
import { readFileSync, existsSync } from "fs";
import { join }                      from "path";
import { getCairoFontBase64, renderFixedSizeHtmlToPdf } from "@/lib/pdf";

const W = 2000, H = 1414;

const esc = s => String(s ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const toEn = s => String(s).replace(/[٠-٩]/g, d => d.charCodeAt(0)-0x0660);

// Load a PNG and return it as a base64 data URI — no pixel manipulation.
// Used for watermark/logo where white blending is handled via CSS mix-blend-mode.
function assetRaw(name) {
  const p = join(process.cwd(), "public", "certificate-assets", name);
  if (!existsSync(p)) return null;
  return `data:image/png;base64,${readFileSync(p).toString("base64")}`;
}

// Load a PNG and strip near-white pixels via sharp so the image is truly
// transparent — used for stamp/signature/medal where mix-blend-mode alone
// is unreliable in Puppeteer PDF mode.
async function asset(name) {
  const p = join(process.cwd(), "public", "certificate-assets", name);
  if (!existsSync(p)) return null;
  try {
    const sharp = (await import("sharp")).default;
    const src = readFileSync(p);
    const { data, info } = await sharp(src)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const px = new Uint8Array(data);
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      if (r > 220 && g > 220 && b > 220) px[i + 3] = 0;
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
  dateText, gender, trainerSignatureUrl,
}) {
  const [font, stamp, adminSig, medal] = await Promise.all([
    getCairoFontBase64(),
    asset("stamp.png"),
    asset("admin-signature.png"),
    asset("medal.png"),
  ]);
  const logoWm = assetRaw("logo-watermark.png");

  const honorific     = gender === "female" ? "الأستاذة:" : "الأستاذ:";
  const completedVerb = gender === "female" ? "أتمت دورة" : "أتم دورة";
  const nameLen       = studentName.length;
  const courseLen     = courseName.length;
  // Font sizes in mm — A4 landscape canvas (267×180mm usable at 15mm padding)
  const nameFz   = Math.max(6, Math.min(12, Math.floor(420 / Math.max(nameLen, 35))));
  const courseFz = Math.max(5, Math.min( 8, Math.floor(300 / Math.max(courseLen, 35))));

  return renderFixedSizeHtmlToPdf(
    html({ font, logoWm, stamp, adminSig, medal,
           studentName, courseName, trainerName, dayName,
           dateEnglish: toEn(dateText), honorific, completedVerb,
           trainerSignatureUrl, nameFz, courseFz }),
    { width: 1123, height: 794 }   // A4 landscape px — used only for viewport
  );
}

/* ─────────────── SVG helpers ─────────────── */

// Gradient triangle for TR corner — right angle AT (340,0) = cert's top-right corner.
// BL corner uses same SVG with rotate(180deg), which mirrors it perfectly.
const TRIANGLE_SVG = `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tg" x1="340" y1="0" x2="0" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#4B96CE"/>
      <stop offset="100%" stop-color="#87C781"/>
    </linearGradient>
  </defs>
  <!-- Layered triangles — right angle at (340,0) = cert corner -->
  <polygon points="340,0 340,340 0,0"   fill="url(#tg)" opacity="0.88"/>
  <polygon points="340,0 340,230 110,0" fill="#4B96CE"   opacity="0.18"/>
  <polygon points="340,0 340,120 220,0" fill="#87C781"   opacity="0.22"/>
  <!-- Green hypotenuse accent line -->
  <line x1="0" y1="0" x2="340" y2="340" stroke="#87C781" stroke-width="2" opacity="0.6"/>
  <!-- White shine lines along the two legs (top edge + right edge) -->
  <line x1="0" y1="0" x2="340" y2="0" stroke="#FFFFFF" stroke-width="4" opacity="0.5"/>
  <line x1="340" y1="0" x2="340" y2="340" stroke="#FFFFFF" stroke-width="4" opacity="0.5"/>
  <!-- L-bracket ornament at the corner (340,0) -->
  <rect x="290" y="0"  width="50"  height="9"  fill="#FFFFFF" opacity="0.9"/>
  <rect x="331" y="0"  width="9"   height="50" fill="#FFFFFF" opacity="0.9"/>
  <rect x="306" y="0"  width="30"  height="4.5" fill="#87C781" opacity="0.9"/>
  <rect x="335.5" y="0" width="4.5" height="30" fill="#87C781" opacity="0.9"/>
  <!-- Diamond ornaments near the corner -->
  <polygon points="310,18 322,30 310,42 298,30" fill="#FFFFFF"  opacity="0.9"/>
  <polygon points="280,10 289,19 280,28 271,19" fill="#87C781" opacity="0.85"/>
</svg>`;

// Gold arc ornament for TL / BR corners (rotated 180° for BR)
const ARC_SVG = `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 180 A 180,180 0 0,1 180,0"
        fill="none" stroke="#C9A84C" stroke-width="3" opacity="0.7"/>
  <path d="M 0 130 A 130,130 0 0,1 130,0"
        fill="none" stroke="#C9A84C" stroke-width="2" opacity="0.5"/>
  <path d="M 0 80  A 80,80  0 0,1 80,0"
        fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.4"/>
  <path d="M 0 38  A 38,38  0 0,1 38,0"
        fill="none" stroke="#4B96CE" stroke-width="2" opacity="0.5"/>
  <!-- small diamond where arcs meet the edge -->
  <polygon points="0,178 7,185 0,192 -7,185" fill="#C9A84C" opacity="0.8"/>
  <polygon points="178,0 185,7 192,0 185,-7" fill="#C9A84C" opacity="0.8"/>
</svg>`;

/* ─────────────── HTML builder ─────────────── */
function html({
  font, logoWm, stamp, adminSig, medal,
  studentName, courseName, trainerName, dayName, dateEnglish,
  honorific, completedVerb, trainerSignatureUrl,
  nameFz, courseFz,
}) {
  // Bottom column image snippets
  const trainerSig = trainerSignatureUrl
    ? `<img class="sig-img" src="${esc(trainerSignatureUrl)}" alt=""/>`
    : `<div class="sig-placeholder"></div>`;

  // Stamp overlaps admin signature: stamp centered on top at 85% opacity
  const stampOverlay = stamp
    ? `<img class="stamp-img" src="${stamp}" alt=""/>`
    : `<svg class="stamp-img" width="130" height="130" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
         <circle cx="65" cy="65" r="58" fill="none" stroke="#4B96CE" stroke-width="3"/>
         <circle cx="65" cy="65" r="48" fill="none" stroke="#4B96CE" stroke-width="1"/>
         <text x="65" y="60" font-size="13" text-anchor="middle" fill="#4B96CE"
               font-weight="700" font-family="Cairo,sans-serif">إدارة شركة</text>
         <text x="65" y="78" font-size="16" text-anchor="middle" fill="#4B96CE"
               font-weight="900" font-family="Cairo,sans-serif">ELITE</text>
       </svg>`;

  const adminSigTag = adminSig
    ? `<img class="admin-sig-img" src="${adminSig}" alt=""/>`
    : `<div class="sig-placeholder"></div>`;

  const medalTag = medal
    ? `<img class="medal-img" src="${medal}" alt=""/>`
    : `<svg class="medal-img" width="288" height="288" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%"   stop-color="#4B96CE"/>
             <stop offset="100%" stop-color="#87C781"/>
           </linearGradient>
         </defs>
         <circle cx="50" cy="50" r="46" fill="none" stroke="url(#mg)" stroke-width="3"/>
         <circle cx="50" cy="50" r="36" fill="none" stroke="#C9A84C" stroke-width="1.5"/>
         <text x="50" y="60" font-size="34" text-anchor="middle"
               fill="#C9A84C" font-family="serif">★</text>
       </svg>`;

  const wmTag = logoWm
    ? `<img class="wm-img" src="${logoWm}" alt=""/>`
    : `<div class="wm-text">ELITE</div>`;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700;900&display=swap" rel="stylesheet">
<style>
@font-face {
  font-family:'Cairo';
  src:url(data:font/ttf;base64,${font}) format('truetype');
  font-weight:100 1000;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
/* A4 landscape in mm — fills the PDF page exactly, no clipping */
html,body{
  width:297mm;height:210mm;
  margin:0;padding:0;overflow:hidden;
  font-family:'Cairo',sans-serif;direction:rtl;
}

/* ══════════ Outer shell ══════════ */
.cert{
  position:relative;
  width:100%;height:100%;
  /* cream background */
  background-color:#FAFAF7;
  background-image:radial-gradient(circle,#E8E8DF 0.4mm,transparent 0.4mm);
  background-size:9.5mm 9.5mm;
  display:flex;flex-direction:column;align-items:center;
  padding:15mm 15mm 5mm;
}

/* ── Borders ── */
.b-outer{
  position:absolute;inset:3mm;
  border:1.2mm solid transparent;
  background:
    linear-gradient(#FAFAF7,#FAFAF7) padding-box,
    linear-gradient(135deg,#4B96CE 0%,#87C781 50%,#4B96CE 100%) border-box;
  pointer-events:none;z-index:1;
}
.b-inner{
  position:absolute;inset:6mm;
  border:0.3mm solid #C9A84C99;
  pointer-events:none;z-index:1;
}

/* ── Corner gold diamond ornaments ── */
.corner-gem{
  position:absolute;width:4mm;height:4mm;
  background:#C9A84C;transform:rotate(45deg);z-index:5;
}
.cg-tr{top:4mm;right:4mm;}.cg-tl{top:4mm;left:4mm;}
.cg-br{bottom:4mm;right:4mm;}.cg-bl{bottom:4mm;left:4mm;}
.corner-gem2{
  position:absolute;width:2.5mm;height:2.5mm;
  background:#C9A84C88;transform:rotate(45deg);z-index:5;
}
.cg2-tr{top:7mm;right:7mm;}.cg2-tl{top:7mm;left:7mm;}
.cg2-br{bottom:7mm;right:7mm;}.cg2-bl{bottom:7mm;left:7mm;}

/* ── Decorative corner SVGs ── */
.corner-svg{position:absolute;pointer-events:none;z-index:3;overflow:hidden;}
.cs-tr{top:0;right:0;width:50mm;height:50mm;}
.cs-bl{bottom:0;left:0;width:50mm;height:50mm;transform:rotate(180deg);}
.cs-tl{top:0;left:0;width:33mm;height:33mm;}
.cs-br{bottom:0;right:0;width:33mm;height:33mm;transform:rotate(180deg);}

/* ── Watermark ── */
.wm-img{
  position:absolute;top:10mm;left:10mm;
  width:200px;height:auto;
  opacity:0.15;
  filter:brightness(0);
  pointer-events:none;z-index:0;
}
.wm-text{
  position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-10deg);
  font-size:32mm;font-weight:900;
  color:#4B96CE;opacity:0.06;
  letter-spacing:3mm;white-space:nowrap;
  pointer-events:none;z-index:0;
}

/* ══════════ Content ══════════ */
.content{
  position:relative;z-index:4;
  width:100%;display:flex;flex-direction:column;
  align-items:center;flex:1;
}

/* 1. Title */
.title{
  font-family:'Noto Naskh Arabic','Cairo',sans-serif;
  font-size:17mm;font-weight:900;
  letter-spacing:2mm;text-align:center;
  line-height:1.15;margin-bottom:1.5mm;
  background:linear-gradient(90deg,#4B96CE 0%,#87C781 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}

/* Title ornamental underline */
.title-orn{
  display:flex;align-items:center;gap:0;
  width:80mm;margin-bottom:3.5mm;
}
.t-seg{height:0;flex:1;border-top:0.6mm solid #C9A84C;}
.t-seg2{height:0;flex:1;border-top:0.25mm solid #C9A84C88;}
.t-diamond{
  width:3.5mm;height:3.5mm;background:#C9A84C;
  transform:rotate(45deg);flex-shrink:0;margin:0 2mm;
}
.t-dot{
  width:1.5mm;height:1.5mm;background:#C9A84C88;
  border-radius:50%;flex-shrink:0;margin:0 1.5mm;
}

/* 2. Intro */
.intro{
  font-size:4.8mm;color:#555;
  text-align:center;margin-bottom:3mm;
}

/* 3. Student name */
.student-row{
  display:flex;flex-direction:row;
  align-items:center;justify-content:center;
  gap:2mm;margin-bottom:2.5mm;width:100%;
}
.name-band{
  display:flex;flex-direction:row;align-items:center;gap:2mm;
  background:linear-gradient(90deg,transparent,#4B96CE14,#4B96CE20,#4B96CE14,transparent);
  padding:2mm 8mm;border-radius:0.5mm;
}
.honorific{
  font-size:6.5mm;font-weight:700;
  color:#4B96CE;white-space:nowrap;flex-shrink:0;
}
.student-name{
  font-size:${nameFz}mm;font-weight:900;
  color:#1a1a2e;white-space:nowrap;
}

/* 4. Double gold divider */
.divider{
  width:70%;display:flex;flex-direction:column;
  align-items:center;gap:1.2mm;margin:1.5mm auto 2.5mm;
}
.div-row{display:flex;align-items:center;gap:2mm;width:100%;}
.div-line{height:0;flex:1;}
.div-line-top{border-top:0.5mm solid #C9A84C;}
.div-line-bot{border-top:0.25mm solid #C9A84C77;}
.div-orn{display:flex;align-items:center;gap:1.5mm;flex-shrink:0;}
.diam-big{width:4mm;height:4mm;background:#C9A84C;transform:rotate(45deg);}
.diam-sm{width:2mm;height:2mm;background:#87C781;transform:rotate(45deg);}
.star-gold{font-size:4.5mm;color:#C9A84C;}

/* 5. Course */
.course-row{
  font-size:5.2mm;color:#333;
  text-align:center;margin-bottom:2mm;white-space:nowrap;
}
.course-name{font-size:${courseFz}mm;font-weight:800;color:#1a5c94;}

/* 6. Trainer */
.trainer-row{font-size:4.8mm;color:#444;text-align:center;margin-bottom:1.5mm;}

/* 7. Date */
.date-row{
  font-size:4.5mm;color:#555;text-align:center;
  direction:ltr;unicode-bidi:embed;
}

/* ══════════ Bottom strip ══════════ */
.bottom-strip{
  position:relative;z-index:4;
  width:100%;
  background:linear-gradient(90deg,
    transparent 0%,#4B96CE12 20%,#4B96CE18 50%,#4B96CE12 80%,transparent 100%);
  border-top:0.25mm solid #C9A84C55;
  margin-top:3mm;padding:2mm 3mm 0;
  display:flex;flex-direction:row;
  align-items:flex-end;justify-content:space-between;
}

/* Bottom columns */
.col{display:flex;flex-direction:column;align-items:center;gap:1mm;min-width:40mm;}

/* Stamp overlapping admin sig */
.stamp-sig-wrap{
  position:relative;width:38mm;height:28mm;
  display:flex;align-items:flex-end;justify-content:center;
}
.admin-sig-img{
  position:absolute;bottom:0;left:50%;
  transform:translateX(-50%);
  height:13mm;max-width:36mm;object-fit:contain;z-index:1;
}
.stamp-img{
  position:absolute;top:0;left:50%;
  transform:translateX(-50%);
  height:22mm;width:22mm;object-fit:contain;
  opacity:0.85;z-index:2;
}
.sig-img{height:13mm;max-width:38mm;object-fit:contain;}
.sig-placeholder{height:13mm;}
.col-line{width:40mm;height:0;border-top:0.35mm solid #888;margin-top:1mm;}
.col-label{font-size:3.5mm;color:#555;text-align:center;margin-top:0.5mm;}

/* Medal */
.medal-img{height:28mm;width:auto;object-fit:contain;}
.logo-name{font-size:5mm;font-weight:900;color:#4B96CE;letter-spacing:1.2mm;}
.logo-sub{font-size:2.5mm;color:#999;letter-spacing:0.5mm;}
</style>
</head>
<body>
<div class="cert">

  <!-- Borders -->
  <div class="b-outer"></div>
  <div class="b-inner"></div>

  <!-- Corner gold diamond ornaments (outer border) -->
  <div class="corner-gem cg-tr"></div>
  <div class="corner-gem cg-tl"></div>
  <div class="corner-gem cg-br"></div>
  <div class="corner-gem cg-bl"></div>
  <!-- Corner gold diamond ornaments (inner border) -->
  <div class="corner-gem2 cg2-tr"></div>
  <div class="corner-gem2 cg2-tl"></div>
  <div class="corner-gem2 cg2-br"></div>
  <div class="corner-gem2 cg2-bl"></div>

  <!-- Decorative corners: triangles TR + BL -->
  <div class="corner-svg cs-tr">${TRIANGLE_SVG}</div>
  <div class="corner-svg cs-bl">${TRIANGLE_SVG}</div>
  <!-- Decorative corners: gold arcs TL + BR -->
  <div class="corner-svg cs-tl">${ARC_SVG}</div>
  <div class="corner-svg cs-br">${ARC_SVG}</div>

  <!-- Watermark -->
  ${wmTag}

  <!-- ───── Main content ───── -->
  <div class="content">

    <div class="title">شهادة إتمام</div>

    <div class="title-orn">
      <div class="t-seg"></div>
      <div class="t-dot"></div>
      <div class="t-diamond"></div>
      <div class="t-dot"></div>
      <div class="t-seg"></div>
      <div class="t-seg2" style="max-width:40px"></div>
    </div>

    <div class="intro">تشهد شركة ELITE للبحث والتطوير التجريبي في علم النفس بأن</div>

    <div class="student-row">
      <div class="name-band">
        <span class="honorific">${esc(honorific)}</span>
        <span class="student-name">${esc(studentName)}</span>
      </div>
    </div>

    <!-- Double divider -->
    <div class="divider">
      <div class="div-row">
        <div class="div-line div-line-top"></div>
        <div class="div-orn">
          <div class="diam-sm"></div>
          <div class="diam-big"></div>
          <span class="star-gold">✦</span>
          <div class="diam-big"></div>
          <div class="diam-sm"></div>
        </div>
        <div class="div-line div-line-top"></div>
      </div>
      <div class="div-row">
        <div class="div-line div-line-bot"></div>
        <div class="div-line div-line-bot" style="max-width:60px"></div>
      </div>
    </div>

    <div class="course-row">
      ${esc(completedVerb)}&ensp;<span class="course-name">${esc(courseName)}</span>
    </div>

    <div class="trainer-row">
      تقديم:&ensp;<strong>${esc(trainerName)}</strong>&emsp;،&ensp;يوم ${esc(dayName)}
    </div>
    <div class="date-row">الموافق:&ensp;${esc(dateEnglish)}</div>

  </div>

  <!-- ───── Bottom strip ───── -->
  <!-- RTL flex: first child → right, last child → left -->
  <div class="bottom-strip">

    <!-- RIGHT: stamp overlapping admin sig -->
    <div class="col">
      <div class="stamp-sig-wrap">
        ${adminSigTag}
        ${stampOverlay}
      </div>
      <div class="col-line"></div>
      <div class="col-label">توقيع الإدارة</div>
    </div>

    <!-- CENTER: medal + ELITE COMPANY -->
    <div class="col">
      ${medalTag}
      <div class="logo-name">ELITE</div>
      <div class="logo-sub">COMPANY</div>
    </div>

    <!-- LEFT: trainer sig -->
    <div class="col">
      ${trainerSig}
      <div class="col-line"></div>
      <div class="col-label">توقيع المدرب</div>
    </div>

  </div>

</div>
</body>
</html>`;
}
