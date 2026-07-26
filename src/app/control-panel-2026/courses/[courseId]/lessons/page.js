import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AdminLessonsManager from "@/components/admin/AdminLessonsManager";

export default async function AdminCourseLessonsPage({ params }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).single();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, bunny_video_id, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <Link href="/control-panel-2026/courses" className="btn btn-outline" style={{ marginBottom: 16 }}>
          ← رجوع لإدارة الدورات
        </Link>
        <h1>دروس دورة: {course?.title || "دورة"}</h1>
        <p>أضف/رتّب/عدّل دروس هذي الدورة — رابط التشغيل يوصل بس للمشترك فعليًا بالدورة</p>

        <div className="dash-section">
          <AdminLessonsManager courseId={courseId} initialLessons={lessons || []} />
        </div>
      </div>
    </>
  );
}
