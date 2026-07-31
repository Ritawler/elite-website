import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { confirmPayment } from "@/lib/payments";
import Header from "@/components/Header";

export default async function PaymentSuccessPage({ searchParams }) {
  const params = await searchParams;
  // UPayments pollutes order_id — use requested_order_id when available
  const orderId = params?.requested_order_id ||
    (Array.isArray(params?.order_id) ? params.order_id[0] : params?.order_id)?.split("?")[0];
  const trackId = params?.track_id || params?.trackId || null;
  console.error("[PaymentSuccess] orderId:", orderId, "trackId:", trackId);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!orderId) redirect("/dashboard");

  // RLS only returns this row if it belongs to the current user — this is
  // what stops someone from confirming a stranger's payment by guessing/
  // reusing an order_id in the URL.
  const { data: payment } = await supabase
    .from("payments")
    .select("id, course_id, status")
    .eq("order_id", orderId)
    .eq("student_id", user.id)
    .single();

  let outcome;
  if (!payment) {
    outcome = { ok: false, reason: "not_found" };
  } else {
    outcome = await confirmPayment({ orderId, trackId });
  }

  const { data: course } = payment
    ? await supabase.from("courses").select("title").eq("id", payment.course_id).single()
    : { data: null };

  return (
    <>
      <Header />
      <div className="auth-wrap">
        <div className="auth-card">
          {outcome.ok ? (
            <>
              <h1>تم الدفع بنجاح ✓</h1>
              <p className="auth-subtitle">
                تم تسجيلك بدورة "{course?.title}" بنجاح. تقدر تشوفها الحين بلوحة تحكمك.
              </p>
              <a href="/dashboard/student" className="btn btn-primary auth-submit">
                الذهاب للوحة التحكم
              </a>
            </>
          ) : (
            <>
              <h1>جارٍ تأكيد الدفع...</h1>
              <p className="auth-subtitle">
                ما قدرنا نأكد عملية الدفع فوراً. لو تم خصم المبلغ فعلاً، بيتأكد اشتراكك تلقائياً خلال دقائق —
                راجع لوحة التحكم بعد شوي. لو استمرت المشكلة، تواصل معنا.
              </p>
              <a href="/dashboard/student" className="btn btn-outline auth-submit">
                الذهاب للوحة التحكم
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
