import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { confirmPayment } from "@/lib/payments";
import Header from "@/components/Header";

// UPayments sometimes redirects KNET to cancelUrl even when payment succeeded.
// We always attempt confirmation if we have a track_id — confirmPayment is
// idempotent, so calling it here is safe.
export default async function PaymentFailedPage({ searchParams }) {
  const params = await searchParams;

  // UPayments appends their own order_id and payment_id to our cancelUrl,
  // polluting the order_id param. requested_order_id is the clean original.
  const orderId = params?.requested_order_id ||
    (Array.isArray(params?.order_id) ? params.order_id[0] : params?.order_id)?.split("?")[0];
  const trackId = params?.track_id || null;


  if (orderId && trackId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const outcome = await confirmPayment({ orderId, trackId });
      if (outcome.ok) {
        redirect(`/payment/success?order_id=${encodeURIComponent(orderId)}&track_id=${encodeURIComponent(trackId)}`);
      }
    }
  }

  return (
    <>
      <Header />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>لم تكتمل عملية الدفع</h1>
          <p className="auth-subtitle">
            تم إلغاء عملية الدفع أو لم تنجح. ما تم خصم أي مبلغ. تقدر تحاول مرة أخرى.
          </p>
          <a href="/courses" className="btn btn-primary auth-submit">
            الرجوع للدورات
          </a>
        </div>
      </div>
    </>
  );
}
