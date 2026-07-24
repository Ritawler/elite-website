import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import CourseComments from "@/components/dashboard/CourseComments";
import CourseMessageThread from "@/components/dashboard/CourseMessageThread";

export default async function StudentDashboard() {
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

  const studentName = profile?.full_name || user.email;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, amount_paid, enrolled_at, course:courses(id, title, description, trainer_id)")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false });

  const courseIds = (enrollments || []).map((e) => e.course?.id).filter(Boolean);

  const { data: certificates } = await supabase
    .from("certificates")
    .select("id, course_id, certificate_url, issued_at")
    .eq("student_id", user.id);

  const { data: allComments } = courseIds.length
    ? await supabase
        .from("comments")
        .select("id, course_id, content, student_name, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: allMessages } = courseIds.length
    ? await supabase
        .from("messages")
        .select("id, course_id, sender_id, receiver_id, content, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مرحباً {studentName} 👋</h1>
        <p>لوحة تحكم المتدرّب</p>

        <div className="dash-section">
          <h2>دوراتي</h2>
          {!enrollments || enrollments.length === 0 ? (
            <p className="dash-empty">ما عندك دورات مسجّل فيها حالياً.</p>
          ) : (
            enrollments.map((e) => {
              const course = e.course;
              if (!course) return null;
              const comments = (allComments || []).filter((c) => c.course_id === course.id);
              const messages = (allMessages || []).filter((m) => m.course_id === course.id);
              return (
                <div className="course-card-dash" key={e.id}>
                  <div className="course-card-dash-head">
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                    </div>
                  </div>

                  <CourseMessageThread
                    courseId={course.id}
                    trainerId={course.trainer_id}
                    studentId={user.id}
                    studentName={studentName}
                    initialMessages={messages}
                  />

                  <CourseComments
                    courseId={course.id}
                    studentId={user.id}
                    studentName={studentName}
                    initialComments={comments}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="dash-section">
          <h2>شهاداتي</h2>
          {!certificates || certificates.length === 0 ? (
            <p className="dash-empty">ما عندك شهادات صادرة بعد.</p>
          ) : (
            <div className="dashboard-card">
              {certificates.map((cert) => {
                const course = enrollments?.find((e) => e.course?.id === cert.course_id)?.course;
                return (
                  <div className="cert-item" key={cert.id}>
                    <span>{course?.title || "دورة"}</span>
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
      </div>
    </>
  );
}
