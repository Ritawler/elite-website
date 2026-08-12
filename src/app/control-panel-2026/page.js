import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";

export default async function AdminPanel() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: users },
    { data: enrollments },
    { data: courses },
    { data: certificates },
  ] = await Promise.all([
    supabase.from("users").select("role"),
    supabase.from("enrollments").select("course_id, amount_paid"),
    supabase.from("courses").select("id, title"),
    supabase.from("certificates").select("id, course_id, certificate_url, issued_at").eq("student_id", user.id),
  ]);

  const usersByRole = { student: 0, trainer: 0, admin: 0 };
  for (const u of users || []) {
    if (usersByRole[u.role] !== undefined) usersByRole[u.role] += 1;
  }

  let totalIncome = 0;
  const countByCourse = {};
  for (const e of enrollments || []) {
    totalIncome += Number(e.amount_paid) || 0;
    countByCourse[e.course_id] = (countByCourse[e.course_id] || 0) + 1;
  }

  const courseTitleById = Object.fromEntries((courses || []).map((c) => [c.id, c.title]));
  const topCourses = Object.entries(countByCourse)
    .map(([courseId, count]) => ({ courseId, count, title: courseTitleById[courseId] || "دورة محذوفة" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>لوحة تحكم الأدمن</h1>
        <p>إحصائيات عامة وإدارة المنصة</p>

        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{users?.length || 0}</div>
            <div className="stat-label">
              إجمالي المستخدمين (طلاب {usersByRole.student} · مدربين {usersByRole.trainer})
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{courses?.length || 0}</div>
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
                  <span>
                    <strong>{c.count}</strong> مشترك
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-section">
          <h2>شهاداتي</h2>
          {!certificates || certificates.length === 0 ? (
            <p className="dash-empty">ما عندك شهادات صادرة بعد.</p>
          ) : (
            <div className="dashboard-card">
              {certificates.map((cert) => {
                const courseTitle = courses?.find((c) => c.id === cert.course_id)?.title || "دورة";
                return (
                  <div className="cert-item" key={cert.id}>
                    <span>{courseTitle}</span>
                    {cert.certificate_url ? (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener"
                        className="btn btn-outline"
                      >
                        تحميل الشهادة
                      </a>
                    ) : (
                      <span className="cert-pending">قيد الإصدار</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
