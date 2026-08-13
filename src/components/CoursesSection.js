"use client";

import Link from "next/link";
import BuyCourseButton from "@/components/BuyCourseButton";

export default function CoursesSection({ courses }) {
  return (
    <section className="section" id="courses">
      <div className="container">
        <div className="section-head reveal">
          <span className="tag">برامجنا التدريبية</span>
          <h2>الدورات التدريبية</h2>
        </div>

        {!courses || courses.length === 0 ? (
          <div className="soon-card reveal">
            <div className="soon-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2 2 7v6c0 5 4 8 10 9 6-1 10-4 10-9V7l-10-5Zm-1 13-4-4 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />
              </svg>
            </div>
            <h3>نُجهّز لكم باقة دورات متخصصة</h3>
            <p>نعمل على إعداد دورات تدريبية متخصصة في علم النفس والتربية والتطوير الذاتي. تابعونا قريباً!</p>
          </div>
        ) : (
          <div className="home-courses-grid">
            {courses.map((course) => {
              const hasDiscount =
                course.discount_price !== null &&
                course.discount_price < course.price;
              return (
                <div className="home-course-card reveal" key={course.id}>
                  {course.image_url && (
                    <Link href={`/courses/${course.id}`}>
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="course-cover-img"
                      />
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
    </section>
  );
}
