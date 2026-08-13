import { createAdminClient } from "@/lib/supabase/admin";
import { checkPaymentStatus } from "@/lib/upayments";
import { sendEnrollmentConfirmation, sendTrainerEnrollmentNotification } from "@/lib/email";

// Confirms a payment and creates the enrollment. Called from two places:
// the UPayments webhook (no user session), and the /payment/success page
// (after checking the visitor actually owns that order). Both paths funnel
// through here so there is exactly one place that trusts UPayments' server
// response — never the webhook body or a URL query param — before crediting
// anything. Safe to call more than once for the same order (idempotent).
export async function confirmPayment({ orderId, trackId }) {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, student_id, course_id, order_id, track_id, amount, status, certificate_name")
    .eq("order_id", orderId)
    .single();

  if (!payment) {
    return { ok: false, reason: "payment_not_found" };
  }

  if (payment.status === "paid") {
    return { ok: true, alreadyProcessed: true, courseId: payment.course_id };
  }

  const effectiveTrackId = trackId || payment.track_id;
  if (!effectiveTrackId) {
    return { ok: false, reason: "missing_track_id" };
  }

  const statusCheck = await checkPaymentStatus(effectiveTrackId);
  const isPaid = statusCheck.ok && (statusCheck.result === "CAPTURED" || statusCheck.status === "done");

  if (!isPaid) {
    await admin
      .from("payments")
      .update({ status: "failed", track_id: effectiveTrackId, updated_at: new Date().toISOString() })
      .eq("id", payment.id)
      .neq("status", "paid");
    return { ok: false, reason: "not_paid" };
  }

  await admin
    .from("payments")
    .update({ status: "paid", track_id: effectiveTrackId, updated_at: new Date().toISOString() })
    .eq("id", payment.id);

  const { data: enrollResult } = await admin
    .from("enrollments")
    .upsert(
      {
        student_id: payment.student_id,
        course_id: payment.course_id,
        amount_paid: payment.amount,
        certificate_name: payment.certificate_name,
      },
      { onConflict: "student_id,course_id", ignoreDuplicates: true }
    )
    .select("enrolled_at")
    .maybeSingle();

  // Send confirmation emails (fire-and-forget — don't fail the payment if email fails)
  try {
    const [{ data: student }, { data: course }] = await Promise.all([
      admin.from("users").select("full_name, email").eq("id", payment.student_id).single(),
      admin.from("courses").select("title, trainer_id").eq("id", payment.course_id).single(),
    ]);

    const enrolledAt = enrollResult?.enrolled_at || new Date().toISOString();

    if (student?.email) {
      let trainerName = "فريق إيليت";
      if (course?.trainer_id) {
        const { data: trainer } = await admin.from("users").select("full_name").eq("id", course.trainer_id).single();
        trainerName = trainer?.full_name || trainerName;
      }
      await sendEnrollmentConfirmation({
        studentEmail: student.email,
        studentName: student.full_name || student.email,
        courseName: course?.title || "",
        trainerName,
        enrolledAt,
      });
    }

    if (course?.trainer_id) {
      const { data: trainer } = await admin.from("users").select("full_name, email").eq("id", course.trainer_id).single();
      if (trainer?.email) {
        await sendTrainerEnrollmentNotification({
          trainerEmail: trainer.email,
          trainerName: trainer.full_name || trainer.email,
          studentName: student?.full_name || student?.email || "",
          courseName: course?.title || "",
          enrolledAt,
        });
      }
    }
  } catch (emailErr) {
    console.error("[payments] Email notification failed:", emailErr);
  }

  return { ok: true, alreadyProcessed: false, courseId: payment.course_id };
}
