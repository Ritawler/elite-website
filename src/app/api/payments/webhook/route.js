import { NextResponse } from "next/server";
import { confirmPayment } from "@/lib/payments";

// Called directly by UPayments' server — there is no logged-in user here.
// We never trust this payload's own claims about success/failure; we only
// use it to learn which order/track to look up, then independently ask
// UPayments (via confirmPayment -> checkPaymentStatus) what actually
// happened. See lib/payments.js for why.
function extractIds(body) {
  const t = body?.transaction || body?.data?.transaction || body;
  return {
    orderId: t?.order_id || body?.order_id,
    trackId: t?.track_id || body?.track_id,
  };
}

export async function POST(request) {
  let body;
  const raw = await request.text();
  try {
    body = JSON.parse(raw);
  } catch {
    body = Object.fromEntries(new URLSearchParams(raw));
  }

  const { orderId, trackId } = extractIds(body);

  if (!orderId) {
    return NextResponse.json({ received: true, note: "no order id in payload" });
  }

  await confirmPayment({ orderId, trackId });

  return NextResponse.json({ received: true });
}
