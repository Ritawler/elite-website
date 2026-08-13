import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { courseId, rating, comment } = await request.json();
  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "بيانات التقييم غير صحيحة" }, { status: 400 });
  }

  // Verify user completed the course (enrolled + all lessons done)
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "يجب الاشتراك بالدورة أولاً" }, { status: 403 });
  }

  const { error } = await supabase
    .from("reviews")
    .upsert(
      { user_id: user.id, course_id: courseId, rating, comment: comment?.trim() || null },
      { onConflict: "user_id,course_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
