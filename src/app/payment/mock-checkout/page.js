// MOCK ONLY — stands in for UPayments' real hosted checkout page while
// UPAYMENTS_MOCK_MODE=true, so the full purchase flow (webhook, payment
// verification, enrollment) can be tested without real UPayments
// credentials. lib/upayments.js only points here in mock mode; this page
// becomes unreachable in normal operation once mock mode is turned off.
"use client";

import { useEffect, useState } from "react";

export default function MockCheckoutPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order_id") || "");
  }, []);

  async function handlePay() {
    setLoading(true);
    await fetch("/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, track_id: `mock-track-${orderId}` }),
    });
    window.location.href = `/payment/success?order_id=${orderId}`;
  }

  function handleCancel() {
    window.location.href = `/payment/failed?order_id=${orderId}`;
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-error" style={{ marginBottom: 20 }}>
          ⚠️ محاكاة دفع (Mock Mode) — ما راح يتم أي خصم فعلي.
        </div>
        <h1>إتمام الدفع</h1>
        <p className="auth-subtitle">رقم الطلب: {orderId}</p>

        <button type="button" className="btn btn-primary auth-submit" onClick={handlePay} disabled={loading}>
          {loading ? "جارٍ المعالجة..." : "ادفع الآن (محاكاة)"}
        </button>
        <button type="button" className="btn btn-outline auth-submit" onClick={handleCancel} disabled={loading}>
          إلغاء
        </button>
      </div>
    </div>
  );
}
