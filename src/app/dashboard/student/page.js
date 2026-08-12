import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import CourseComments from "@/components/dashboard/CourseComments";
import CourseMessageThread from "@/components/dashboard/CourseMessageThread";
import CourseLessons from "@/components/dashboard/CourseLessons";
import TrainerRequestBox from "@/components/dashboard/TrainerRequestBox";
import MyCertificatesList from "@/components/dashboard/MyCertificatesList";

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

  const { data: allLessons } = courseIds.length
    ? await supabase
        .from("lessons")
        .select("id, course_id, title, description, order_index")
        .in("course_id", courseIds)
        .order("order_index", { ascending: true })
    : { data: [] };

  const lessonIds = (allLessons || []).map((l) => l.id);
  const { data: allProgress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: [] };
  const completedLessonIds = (allProgress || []).map((p) => p.lesson_id);

  const { data: trainerRequest } = await supabase
    .from("trainer_requests")
    .select("id, status")
    .eq("student_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مرحباً {studentName} 👋</h1>
        <p>لوحة تحكم المتدرّب</p>

        <a href="/courses" className="btn btn-outline">
          تصفّح الدورات المتاحة
        </a>

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
              const lessons = (allLessons || []).filter((l) => l.course_id === course.id);
              const courseLessonIds = lessons.map((l) => l.id);
              const completedForCourse = completedLessonIds.filter((id) => courseLessonIds.includes(id));
              return (
                <div className="course-card-dash" key={e.id}>
                  <div className="course-card-dash-head">
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                    </div>
                  </div>

                  <CourseLessons lessons={lessons} initialCompletedIds={completedForCourse} />

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
          <MyCertificatesList
            certificates={certificates}
            courseMap={Object.fromEntries(
              (enrollments || []).filter((e) => e.course).map((e) => [e.course.id, e.course.title])
            )}
          />
        </div>

        <TrainerRequestBox
          studentId={user.id}
          studentName={studentName}
          studentEmail={user.email}
          initialRequest={trainerRequest}
        />
      </div>
    </>
  );
}
