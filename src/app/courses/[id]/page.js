import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BuyCourseButton from "@/components/BuyCourseButton";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, price, discount_price, image_url, trainer_id, trainer:users!trainer_id(full_name)")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!course) redirect("/courses");

  const { data: { user } } = await supabase.auth.getUser();

  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", id)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", id)
    .order("order_index", { ascending: true });

  // Reviews — table may not exist yet; fail gracefully
  let reviews = [];
  let avgRating = null;
  try {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer:users(full_name)")
      .eq("course_id", id)
      .order("created_at", { ascending: false });
    reviews = reviewData || [];
    if (reviews.length > 0) {
      avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    }
  } catch { /* reviews table not created yet */ }

  const hasDiscount = course.discount_price !== null && course.discount_price < course.price;
  const trainerName = course.trainer?.full_name || "إيليت";

  return (
    <>
      <Header />
      <div className="dashboard-wrap" style={{ maxWidth: 780 }}>

        {/* Cover image */}
        {course.image_url && (
          <img src={course.image_url} alt={course.title} className="course-detail-cover" />
        )}

        {/* Title + meta */}
        <h1 style={{ marginBottom: 4 }}>{course.title}</h1>
        <p className="course-detail-trainer">المدرب: <strong>{trainerName}</strong></p>
        {avgRating && (
          <p className="course-detail-rating">⭐ {avgRating} / 5 &nbsp;({reviews.length} تقييم)</p>
        )}

        {/* Description */}
        {course.description && (
          <div className="dash-section">
            <h2>عن الدورة</h2>
            <p style={{ lineHeight: 1.8, color: "var(--text-muted)", fontSize: 15 }}>{course.description}</p>
          </div>
        )}

        {/* Lessons preview */}
        {lessons && lessons.length > 0 && (
          <div className="dash-section">
            <h2>محتوى الدورة <span style={{ fontWeight: 400, fontSize: 15, color: "var(--text-muted)" }}>({lessons.length} درس)</span></h2>
            <div className="course-lessons-preview">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="lesson-preview-row">
                  <span className="lesson-num">{i + 1}</span>
                  <span>{lesson.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price + buy / start */}
        <div className="dash-section course-detail-purchase">
          <div className="home-course-price" style={{ fontSize: 20 }}>
            {hasDiscount ? (
              <>
                <span className="price-old">{course.price} د.ك</span>
                <span className="price-new">{course.discount_price} د.ك</span>
              </>
            ) : (
              <span className="price-new">{course.price} د.ك</span>
            )}
          </div>

          {isEnrolled ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: 16, padding: "12px 28px" }}>
              ابدأ التعلم ←
            </Link>
          ) : (
            <BuyCourseButton courseId={course.id} />
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="dash-section">
            <h2>تقييمات المتدربين</h2>
            {reviews.map((r) => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <span className="review-name">{r.reviewer?.full_name || "متدرب"}</span>
                  <span className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Link href="/courses" className="btn btn-outline">← العودة للدورات</Link>
        </div>
      </div>
    </>
  );
}
