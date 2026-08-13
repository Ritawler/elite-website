import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import CourseLessons from "@/components/dashboard/CourseLessons";
import MyCertificatesList from "@/components/dashboard/MyCertificatesList";
import AdminMessagingPanel from "@/components/admin/AdminMessagingPanel";

export default async function AdminPanel() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Platform-wide stats
  const [
    { data: users },
    { data: allEnrollments },
    { data: allCourses },
  ] = await Promise.all([
    supabase.from("users").select("role"),
    supabase.from("enrollments").select("course_id, amount_paid"),
    supabase.from("courses").select("id, title"),
  ]);

  // Admin's messages (all conversations — where admin is sender OR receiver)
  const { data: adminProfile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: adminMessages } = await supabase
    .from("messages")
    .select("*, sender:users!sender_id(full_name), receiver:users!receiver_id(full_name)")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  // Admin's own enrollments + certificates
  const { data: myEnrollments } = await supabase
    .from("enrollments")
    .select("id, enrolled_at, course:courses(id, title, description)")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false });

  const { data: myCertificates } = await supabase
    .from("certificates")
    .select("id, course_id, certificate_url, issued_at")
    .eq("student_id", user.id);

  // Lessons + progress for admin's enrolled courses
  const myCourseIds = (myEnrollments || []).map((e) => e.course?.id).filter(Boolean);

  const { data: myLessons } = myCourseIds.length
    ? await supabase
        .from("lessons")
        .select("id, course_id, title, description, order_index")
        .in("course_id", myCourseIds)
        .order("order_index", { ascending: true })
    : { data: [] };

  const lessonIds = (myLessons || []).map((l) => l.id);
  const { data: myProgress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: [] };

  const completedLessonIds = (myProgress || []).map((p) => p.lesson_id);

  // Stats computation
  const usersByRole = { student: 0, trainer: 0, admin: 0 };
  for (const u of users || []) {
    if (usersByRole[u.role] !== undefined) usersByRole[u.role] += 1;
  }

  let totalIncome = 0;
  const countByCourse = {};
  for (const e of allEnrollments || []) {
    totalIncome += Number(e.amount_paid) || 0;
    countByCourse[e.course_id] = (countByCourse[e.course_id] || 0) + 1;
  }

  const courseTitleById = Object.fromEntries((allCourses || []).map((c) => [c.id, c.title]));
  const topCourses = Object.entries(countByCourse)
    .map(([courseId, count]) => ({ courseId, count, title: courseTitleById[courseId] || "دورة محذوفة" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // courseMap for MyCertificatesList
  const courseMap = Object.fromEntries(
    [...(allCourses || []), ...(myEnrollments || []).map((e) => e.course).filter(Boolean)]
      .map((c) => [c.id, c.title])
  );

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>لوحة تحكم الأدمن</h1>
        <p>إحصائيات عامة وإدارة المنصة</p>

        {/* Platform stats */}
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{users?.length || 0}</div>
            <div className="stat-label">
              إجمالي المستخدمين (طلاب {usersByRole.student} · مدربين {usersByRole.trainer})
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{allCourses?.length || 0}</div>
            <div className="stat-label">إجمالي الدورات</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalIncome.toFixed(2)} د.ك</div>
            <div className="stat-label">إجمالي الدخل</div>
          </div>
        </div>

        <div className="dash-section">
          <h2>أكثر الدورات مبيعاً</h2>
          {topCourses.length === 0 ? (
            <p className="dash-empty">ما فيه اشتراكات بعد.</p>
          ) : (
            <div className="dashboard-card">
              {topCourses.map((c) => (
                <div className="cert-item" key={c.courseId}>
                  <span>{c.title}</span>
                  <span><strong>{c.count}</strong> مشترك</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin's own courses */}
        <div className="dash-section">
          <h2>دوراتي</h2>
          {!myEnrollments || myEnrollments.length === 0 ? (
            <>
              <p className="dash-empty">ما عندك دورات مسجّل فيها حالياً.</p>
              <a href="/courses" className="btn btn-outline" style={{ marginTop: 8 }}>
                تصفّح الدورات المتاحة
              </a>
            </>
          ) : (
            myEnrollments.map((e) => {
              const course = e.course;
              if (!course) return null;
              const lessons = (myLessons || []).filter((l) => l.course_id === course.id);
              const courseLessonIds = lessons.map((l) => l.id);
              const completedForCourse = completedLessonIds.filter((id) => courseLessonIds.includes(id));
              return (
                <div className="course-card-dash" key={e.id}>
                  <div className="course-card-dash-head">
                    <div>
                      <h3>{course.title}</h3>
                      {course.description && <p>{course.description}</p>}
                    </div>
                  </div>
                  <CourseLessons lessons={lessons} initialCompletedIds={completedForCourse} />
                </div>
              );
            })
          )}
        </div>

        {/* Admin's own certificates */}
        <div className="dash-section">
          <h2>شهاداتي</h2>
          <MyCertificatesList certificates={myCertificates} courseMap={courseMap} />
        </div>

        {/* Admin messaging */}
        <div className="dash-section">
          <h2>الرسائل</h2>
          <AdminMessagingPanel
            adminId={user.id}
            adminName={adminProfile?.full_name || "الأدمن"}
            initialMessages={adminMessages || []}
          />
        </div>

        {/* Admin tools */}
        <div className="dash-section">
          <h2>الإدارة</h2>
          <div className="new-course-row">
            <Link href="/control-panel-2026/courses" className="btn btn-primary">
              إدارة الدورات
            </Link>
            <Link href="/control-panel-2026/permissions" className="btn btn-primary">
              إدارة الصلاحيات
            </Link>
            <Link href="/control-panel-2026/evaluations" className="btn btn-primary">
              التقييم الشهري
            </Link>
            <Link href="/control-panel-2026/member-topics" className="btn btn-primary">
              مواضيع الأعضاء
            </Link>
            <Link href="/reviews/trainer-requests" className="btn btn-outline">
              طلبات المدربين
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
