"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function CourseRow({ course, onDeleted }) {
  const supabase = createClient();
  const [price, setPrice] = useState(course.price ?? 0);
  const [discountPrice, setDiscountPrice] = useState(course.discount_price ?? "");
  const [isPublished, setIsPublished] = useState(course.is_published);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("courses")
      .update({
        price: Number(price) || 0,
        discount_price: discountPrice === "" ? null : Number(discountPrice),
        is_published: isPublished,
      })
      .eq("id", course.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleDelete() {
    if (!confirm(`تأكيد حذف دورة "${course.title}"؟`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (!error) onDeleted(course.id);
  }

  return (
    <div className="course-card-dash">
      <div className="course-card-dash-head">
        <div>
          <h3>{course.title}</h3>
          <p>
            المدرّب: {course.trainer?.full_name || course.trainer?.email || "غير معروف"}
          </p>
        </div>
        <span className={`badge ${isPublished ? "badge-published" : "badge-draft"}`}>
          {isPublished ? "منشورة" : "مسودة"}
        </span>
      </div>

      <div className="new-course-row" style={{ marginTop: 14 }}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="السعر"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={discountPrice}
          onChange={(e) => setDiscountPrice(e.target.value)}
          placeholder="سعر بعد الخصم (اختياري)"
        />
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          منشورة
        </label>
      </div>

      <div className="new-course-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التغييرات"}
        </button>
        <button type="button" className="btn btn-outline" onClick={handleDelete}>
          حذف الدورة
        </button>
      </div>
    </div>
  );
}

export default function AdminCourseList({ initialCourses }) {
  const [courses, setCourses] = useState(initialCourses);

  function handleDeleted(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  if (courses.length === 0) {
    return <p className="dash-empty">ما فيه دورات بالمنصة بعد.</p>;
  }

  return (
    <div>
      {courses.map((course) => (
        <CourseRow key={course.id} course={course} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
