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

export async function createCharge({ orderId, amount, description, customerUniqueId, customerName, customerEmail, returnUrl, cancelUrl, notificationUrl }) {
  if (MOCK_MODE) {
    return {
      ok: true,
      link: `${new URL(returnUrl).origin}/payment/mock-checkout?order_id=${encodeURIComponent(orderId)}`,
    };
  }

  const chargeUrl = `${BASE_URL}/charge`;
  const requestBody = {
    order: {
      id: orderId,
      reference: orderId,
      description,
      currency: "KWD",
      amount,
    },
    paymentGateway: { src: "knet" },
    language: "ar",
    reference: { id: orderId },
    customer: {
      uniqueId: customerUniqueId,
      name: customerName,
      email: customerEmail,
      mobile: "+96500000000",
    },
    returnUrl,
    cancelUrl,
    notificationUrl,
  };
  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
  const res = await fetch(chargeUrl, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
  });

  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (!res.ok || !data?.status || !data?.data?.link) {
    return { ok: false, error: data?.message || `HTTP ${res.status}` };
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
