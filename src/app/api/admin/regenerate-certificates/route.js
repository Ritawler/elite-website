import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCertificatePdf } from "@/lib/certificate";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const admin = createAdminClient();

  // Get course + trainer info
  const { data: course } = await admin
    .from("courses")
    .select("id, title, trainer_id")
    .eq("id", courseId)
    .single();
  if (!course) return NextResponse.json({ error: "course not found" }, { status: 404 });

  const { data: trainerProfile } = await admin
    .from("users")
    .select("full_name")
    .eq("id", course.trainer_id)
    .single();
  const trainerName = trainerProfile?.full_name || "";

  // Get all lessons for the course
  const { data: lessons } = await admin.from("lessons").select("id").eq("course_id", courseId);
  const lessonIds = (lessons || []).map((l) => l.id);
  if (lessonIds.length === 0) return NextResponse.json({ error: "no lessons" }, { status: 400 });

  // Find users who completed ALL lessons
  const { data: progressRows } = await admin
    .from("lesson_progress")
    .select("user_id, lesson_id")
    .in("lesson_id", lessonIds);

  const byUser = {};
  for (const row of progressRows || []) {
    if (!byUser[row.user_id]) byUser[row.user_id] = new Set();
    byUser[row.user_id].add(row.lesson_id);
  }
  const completedUserIds = Object.entries(byUser)
    .filter(([, set]) => lessonIds.every((id) => set.has(id)))
    .map(([uid]) => uid);

  if (completedUserIds.length === 0) {
    return NextResponse.json({ message: "no completors found", regenerated: 0 });
  }

  const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dateText = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}`;

  const results = [];

  for (const userId of completedUserIds) {
    try {
      const { data: userProfile } = await admin
        .from("users")
        .select("full_name, gender")
        .eq("id", userId)
        .single();

      const { data: enrollment } = await admin
        .from("enrollments")
        .select("certificate_name")
        .eq("student_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      const studentName = enrollment?.certificate_name || userProfile?.full_name || userId;

      const pdfBuffer = await generateCertificatePdf({
        studentName,
        courseName: course.title,
        trainerName,
        dayName,
        dateText,
        gender: userProfile?.gender,
      });

      const filePath = `${userId}/${courseId}.pdf`;
      await admin.storage
        .from("certificates")
        .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

      const { data: { publicUrl } } = admin.storage.from("certificates").getPublicUrl(filePath);

      await admin.from("certificates").upsert(
        { student_id: userId, course_id: courseId, certificate_url: publicUrl },
        { onConflict: "student_id,course_id" }
      );

      results.push({ userId, status: "ok" });
    } catch (err) {
      console.error(`[regenerate] failed for user ${userId}:`, err);
      results.push({ userId, status: "error", error: err.message });
    }
  }

  return NextResponse.json({ regenerated: results.filter((r) => r.status === "ok").length, results });
}
