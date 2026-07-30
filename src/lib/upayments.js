// Server-only wrapper around the UPayments API. Never import from a Client
// Component — UPAYMENTS_API_KEY must never reach the browser.
//
// UPAYMENTS_MOCK_MODE=true short-circuits both calls with fake responses so
// the rest of the flow (discount calc, payments row, enrollment, trainer
// income) can be built and tested before a real UPayments Sandbox key exists.
// Flip it to "false" once real Sandbox credentials are in .env.local — no
// other code needs to change.

const MOCK_MODE = process.env.UPAYMENTS_MOCK_MODE === "true";
const BASE_URL = process.env.UPAYMENTS_BASE_URL;
const API_KEY = process.env.UPAYMENTS_API_KEY;

export async function createCharge({ orderId, amount, description, returnUrl, cancelUrl, notificationUrl }) {
  if (MOCK_MODE) {
    return {
      ok: true,
      link: `${new URL(returnUrl).origin}/payment/mock-checkout?order_id=${encodeURIComponent(orderId)}`,
    };
  }

  const res = await fetch(`${BASE_URL}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      order: {
        id: orderId,
        reference: orderId,
        description,
        currency: "KWD",
        amount,
      },
      language: "ar",
      reference: { id: orderId },
      returnUrl,
      cancelUrl,
      notificationUrl,
    }),
  });

  const data = await res.json();
  console.error("[UPayments createCharge] status:", res.status, "body:", JSON.stringify(data));
  if (!res.ok || !data?.status || !data?.data?.link) {
    return { ok: false, error: data?.message || "تعذّر إنشاء رابط الدفع" };
  }
  return { ok: true, link: data.data.link };
}

export async function checkPaymentStatus(trackId) {
  if (MOCK_MODE) {
    return { ok: true, result: "CAPTURED", status: "done" };
  }

  const res = await fetch(`${BASE_URL}/get-payment-status/${encodeURIComponent(trackId)}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const data = await res.json();
  const transaction = data?.data?.transaction;
  if (!res.ok || !data?.status || !transaction) {
    return { ok: false, error: data?.message || "تعذّر التحقق من حالة الدفع" };
  }
  return { ok: true, result: transaction.result, status: transaction.status };
}
