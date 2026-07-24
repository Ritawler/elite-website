import { createAdminClient } from "@/lib/supabase/admin";
import { checkPaymentStatus } from "@/lib/upayments";

// Confirms a payment and creates the enrollment. Called from two places:
// the UPayments webhook (no user session), and the /payment/success page
// (after checking the visitor actually owns that order). Both paths funnel
// through here so there is exactly one place that trusts UPayments' server
// response — never the webhook body or a URL query param — before crediting
// anything. Safe to call more than once for the same order (idempotent).
export async function confirmPayment({ orderId, trackId }) {
  const admin = createAdminClient();

  const { data: payment, error: lookupError } = await admin
    .from("payments")
    .select("id, student_id, course_id, order_id, track_id, amount, status")
    .eq("order_id", orderId)
    .single();

  if (!payment) {
    // Temporary diagnostic — remove once confirmed stable in production.
    return {
      ok: false,
      reason: "payment_not_found",
      debug: {
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        keyLength: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").length,
        lookupError: lookupError?.message,
      },
    };
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

  await admin
    .from("enrollments")
    .upsert(
      { student_id: payment.student_id, course_id: payment.course_id, amount_paid: payment.amount },
      { onConflict: "student_id,course_id", ignoreDuplicates: true }
    );

  return { ok: true, alreadyProcessed: false, courseId: payment.course_id };
}
