// Server-only email helper using Resend.
// Set RESEND_API_KEY in .env.local and Vercel env vars.
// From address: configure your domain in Resend or use the sandbox default.

const FROM = process.env.RESEND_FROM_EMAIL || "ELITE <onboarding@resend.dev>";

async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}

export async function sendEnrollmentConfirmation({ studentEmail, studentName, courseName, trainerName, enrolledAt }) {
  const date = new Date(enrolledAt).toLocaleDateString("ar-KW", {
    year: "numeric", month: "long", day: "numeric",
  });
  await send({
    to: studentEmail,
    subject: `تأكيد اشتراكك في دورة "${courseName}"`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#2C5F8A;">مرحباً ${studentName}،</h2>
        <p>تم تأكيد اشتراكك بنجاح في:</p>
        <div style="background:#f0f7ff;border-radius:10px;padding:16px 20px;margin:16px 0;">
          <p style="margin:0;font-size:18px;font-weight:bold;color:#1a3a5c;">${courseName}</p>
          <p style="margin:6px 0 0;color:#555;">المدرب: ${trainerName || "فريق إيليت"}</p>
          <p style="margin:6px 0 0;color:#555;">تاريخ الاشتراك: ${date}</p>
        </div>
        <p>يمكنك الوصول للدورة من <a href="https://eliteco.com.kw/dashboard" style="color:#4B96CE;">لوحة التحكم</a>.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:12px;color:#999;">ELITE — للأبحاث التجريبية والتطوير في علم النفس</p>
      </div>
    `,
  });
}

export async function sendTrainerEnrollmentNotification({ trainerEmail, trainerName, studentName, courseName, enrolledAt }) {
  const date = new Date(enrolledAt).toLocaleDateString("ar-KW", {
    year: "numeric", month: "long", day: "numeric",
  });
  await send({
    to: trainerEmail,
    subject: `متدرب جديد في دورة "${courseName}"`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#2C5F8A;">مرحباً ${trainerName}،</h2>
        <p>اشترك متدرب جديد في دورتك:</p>
        <div style="background:#f0f7ff;border-radius:10px;padding:16px 20px;margin:16px 0;">
          <p style="margin:0;font-size:16px;font-weight:bold;color:#1a3a5c;">اسم المتدرب: ${studentName}</p>
          <p style="margin:6px 0 0;color:#555;">الدورة: ${courseName}</p>
          <p style="margin:6px 0 0;color:#555;">التاريخ: ${date}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:12px;color:#999;">ELITE — للأبحاث التجريبية والتطوير في علم النفس</p>
      </div>
    `,
  });
}
