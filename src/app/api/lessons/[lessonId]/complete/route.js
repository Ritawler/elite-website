import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCertificatePdf } from "@/lib/certificate";

export async function POST(request, { params }) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Same trick as the playback route: RLS on public.lessons already
  // restricts this to a lesson the current user can actually access
  // (enrolled student, course trainer, or admin) — see supabase/lessons.sql.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "غير مصرّح لك بهذا الدرس" }, { status: 403 });
  }

  const { error: progressError } = await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: user.id, lesson_id: lessonId },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
    );

  if (progressError) {
    return NextResponse.json({ error: "تعذّر تسجيل إكمال الدرس" }, { status: 500 });
  }

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", lesson.course_id);

  const { data: courseLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", lesson.course_id);

  const lessonIds = (courseLessons || []).map((l) => l.id);

  const { count: completedCount } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("lesson_id", lessonIds);

  const courseCompleted = totalLessons > 0 && completedCount >= totalLessons;

  if (!courseCompleted) {
    return NextResponse.json({ completed: false, certificateIssued: false });
  }

  const admin = createAdminClient();

  const { data: existingCertificate } = await admin
    .from("certificates")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", lesson.course_id)
    .maybeSingle();

  if (existingCertificate) {
    return NextResponse.json({ completed: true, certificateIssued: false, alreadyIssued: true });
  }

  const { data: profile } = await admin
    .from("users")
    .select("full_name, gender")
    .eq("id", user.id)
    .single();

  const { data: course } = await admin
    .from("courses")
    .select("title, trainer_id, trainer_signature_url")
    .eq("id", lesson.course_id)
    .single();

  const { data: trainerProfile } = await admin
    .from("users")
    .select("full_name")
    .eq("id", course.trainer_id)
    .single();

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("certificate_name")
    .eq("student_id", user.id)
    .eq("course_id", lesson.course_id)
    .maybeSingle();

  const studentName = enrollment?.certificate_name || profile?.full_name || user.email;

  const pdfBuffer = await generateCertificatePdf({
    studentName,
    courseName: course.title,
    trainerName: trainerProfile?.full_name || "",
    trainerSignatureUrl: course.trainer_signature_url,
    gender: profile?.gender,
  });

  const filePath = `${user.id}/${lesson.course_id}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("certificates")
    .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ completed: true, certificateIssued: false, error: "تعذّر رفع الشهادة" });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("certificates").getPublicUrl(filePath);

  await admin
    .from("certificates")
    .upsert(
      { student_id: user.id, course_id: lesson.course_id, certificate_url: publicUrl },
      { onConflict: "student_id,course_id" }
    );

  return NextResponse.json({ completed: true, certificateIssued: true });
}
