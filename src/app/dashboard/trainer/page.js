import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import MessageInbox from "@/components/dashboard/MessageInbox";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const trainerName = profile?.full_name || user.email;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, price, is_published, created_at")
    .eq("trainer_id", user.id)
    .order("created_at", { ascending: false });

  const courseIds = (courses || []).map((c) => c.id);

  const { data: enrollments } = courseIds.length
    ? await supabase.from("enrollments").select("course_id, amount_paid").in("course_id", courseIds)
    : { data: [] };

  const statsByCourse = {};
  let totalIncome = 0;
  let totalStudents = 0;
  for (const e of enrollments || []) {
    if (!statsByCourse[e.course_id]) statsByCourse[e.course_id] = { count: 0, income: 0 };
    statsByCourse[e.course_id].count += 1;
    statsByCourse[e.course_id].income += Number(e.amount_paid) || 0;
    totalIncome += Number(e.amount_paid) || 0;
    totalStudents += 1;
  }

  const { data: allMessages } = await supabase
    .from("messages")
    .select("id, course_id, sender_id, receiver_id, content, sender_name, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مرحباً {trainerName} 👋</h1>
        <p>لوحة تحكم المدرّب</p>

        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{courses?.length || 0}</div>
            <div className="stat-label">عدد الدورات</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">إجمالي المشتركين</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalIncome.toFixed(2)} د.ك</div>
            <div className="stat-label">إجمالي الدخل</div>
          </div>
        </div>

        <div className="dash-section">
          <h2>دوراتي</h2>

          {(courses || []).map((course) => {
            const stats = statsByCourse[course.id] || { count: 0, income: 0 };
            return (
              <div className="course-card-dash" key={course.id}>
                <div className="course-card-dash-head">
                  <div>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                  </div>
                  <span className={`badge ${course.is_published ? "badge-published" : "badge-draft"}`}>
                    {course.is_published ? "منشورة" : "مسودة"}
                  </span>
                </div>
                <div className="course-card-dash-stats">
                  <span>
                    المشتركين: <strong>{stats.count}</strong>
                  </span>
                  <span>
                    الدخل: <strong>{stats.income.toFixed(2)} د.ك</strong>
                  </span>
                </div>
              </div>
            );
          })}

        </div>

        <div className="dash-section">
          <h2>الرسائل</h2>
          <MessageInbox
            trainerId={user.id}
            trainerName={trainerName}
            initialMessages={allMessages || []}
          />
        </div>
      </div>
    </>
  );
}
