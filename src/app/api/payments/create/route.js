import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCharge } from "@/lib/upayments";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { courseId, certificateName } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price, discount_price, is_published")
    .eq("id", courseId)
    .single();

  if (!course || !course.is_published) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }

  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({ error: "already enrolled" }, { status: 409 });
  }

  const amount =
    course.discount_price !== null && course.discount_price < course.price
      ? course.discount_price
      : course.price;

  const orderId = crypto.randomUUID().replace(/-/g, "");
  const origin = new URL(request.url).origin;

  // Free course: skip UPayments entirely and enroll directly. Uses the
  // admin client since students have no insert policy on enrollments
  // anymore — enrollment only ever happens server-side, after this route
  // has already confirmed (above) that the course is real, published, and
  // genuinely free.
  if (amount <= 0) {
    const admin = createAdminClient();
    await admin
      .from("enrollments")
      .upsert(
        { student_id: user.id, course_id: courseId, amount_paid: 0, certificate_name: certificateName || null },
        { onConflict: "student_id,course_id", ignoreDuplicates: true }
      );
    return NextResponse.json({ url: `${origin}/dashboard/student` });
  }

  const { error: insertError } = await supabase.from("payments").insert({
    student_id: user.id,
    course_id: courseId,
    order_id: orderId,
    amount,
    certificate_name: certificateName || null,
  });

  if (insertError) {
    return NextResponse.json({ error: "could not start payment" }, { status: 500 });
  }

  const charge = await createCharge({
    orderId,
    amount,
    description: course.title,
    returnUrl: `${origin}/payment/success?order_id=${orderId}`,
    cancelUrl: `${origin}/payment/failed?order_id=${orderId}`,
    notificationUrl: `${origin}/api/payments/webhook`,
  });

  if (!charge.ok) {
    return NextResponse.json({ error: charge.error }, { status: 502 });
  }

  return NextResponse.json({ url: charge.link });
}
