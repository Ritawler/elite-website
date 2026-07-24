import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BuyCourseButton from "@/components/BuyCourseButton";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, price, discount_price")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>الدورات المتاحة</h1>
        <p>تصفّح دوراتنا التدريبية واشترك مباشرة</p>

        <div className="dash-section">
          {!courses || courses.length === 0 ? (
            <p className="dash-empty">ما فيه دورات منشورة حالياً.</p>
          ) : (
            courses.map((course) => {
              const hasDiscount =
                course.discount_price !== null && course.discount_price < course.price;
              return (
                <div className="course-card-dash" key={course.id}>
                  <div className="course-card-dash-head">
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      {hasDiscount ? (
                        <>
                          <div style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>
                            {course.price} د.ك
                          </div>
                          <div style={{ fontWeight: 800, color: "var(--primary-dark)" }}>
                            {course.discount_price} د.ك
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 800, color: "var(--primary-dark)" }}>
                          {course.price} د.ك
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <BuyCourseButton courseId={course.id} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
