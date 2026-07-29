import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AdminCourseList from "@/components/admin/AdminCourseList";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, description, price, discount_price, is_published, trainer_signature_url, trainer:users(full_name, email)"
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>إدارة الدورات</h1>
        <p>تحكم بالسعر والخصم وحالة النشر لأي دورة بالمنصة</p>

        <div className="dash-section">
          <AdminCourseList initialCourses={courses || []} />
        </div>
      </div>
    </>
  );
}
