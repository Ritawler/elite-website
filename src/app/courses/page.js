import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BuyCourseButton from "@/components/BuyCourseButton";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, price, discount_price, image_url")
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
            <div className="home-courses-grid">
              {courses.map((course) => {
                const hasDiscount =
                  course.discount_price !== null && course.discount_price < course.price;
                return (
                  <div className="home-course-card" key={course.id}>
                    {course.image_url && (
                      <Link href={`/courses/${course.id}`}>
                        <img src={course.image_url} alt={course.title} className="course-cover-img" />
                      </Link>
                    )}
                    <div className="home-course-card-body">
                      <Link href={`/courses/${course.id}`} className="home-course-title-link">
                        <h3 className="home-course-title">{course.title}</h3>
                      </Link>
                      {course.description && (
                        <p className="home-course-desc">{course.description}</p>
                      )}
                    </div>
                    <div className="home-course-card-footer">
                      <div className="home-course-price">
                        {hasDiscount ? (
                          <>
                            <span className="price-old">{course.price} د.ك</span>
                            <span className="price-new">{course.discount_price} د.ك</span>
                          </>
                        ) : (
                          <span className="price-new">{course.price} د.ك</span>
                        )}
                      </div>
                      <BuyCourseButton courseId={course.id} />
                    </div>
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
