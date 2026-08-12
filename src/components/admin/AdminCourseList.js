"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function CourseRow({ course, onDeleted }) {
  const supabase = createClient();
  const [price, setPrice] = useState(course.price ?? 0);
  const [discountPrice, setDiscountPrice] = useState(course.discount_price ?? "");
  const [isPublished, setIsPublished] = useState(course.is_published);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(course.trainer_signature_url || "");
  const [uploadingSignature, setUploadingSignature] = useState(false);

  async function handleSignatureUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSignature(true);

    const filePath = `${course.id}/signature.png`;
    const { error: uploadError } = await supabase.storage
      .from("trainer-signatures")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploadingSignature(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("trainer-signatures").getPublicUrl(filePath);

    await supabase.from("courses").update({ trainer_signature_url: publicUrl }).eq("id", course.id);

    setSignatureUrl(`${publicUrl}?t=${Date.now()}`);
    setUploadingSignature(false);
  }

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

      <div className="new-course-row" style={{ marginTop: 12, alignItems: "center" }}>
        {signatureUrl && (
          <img
            src={signatureUrl}
            alt="توقيع المدرّب"
            style={{ height: 40, background: "#fff", borderRadius: 6, padding: 2 }}
          />
        )}
        <label className="btn btn-outline" style={{ cursor: "pointer" }}>
          {uploadingSignature ? "جارٍ الرفع..." : signatureUrl ? "تغيير توقيع المدرّب" : "رفع توقيع المدرّب"}
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureUpload}
            disabled={uploadingSignature}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div className="new-course-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التغييرات"}
        </button>
        <button type="button" className="btn btn-outline" onClick={handleDelete}>
          حذف الدورة
        </button>
        <Link href={`/control-panel-2026/courses/${course.id}/lessons`} className="btn btn-outline">
          إدارة الدروس
        </Link>
      </div>
    </div>
  );
}

function AddCourseForm({ onAdded }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTrainers() {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("role", "trainer")
      .order("full_name");
    setTrainers(data || []);
  }

  function handleOpen() {
    setOpen(true);
    loadTrainers();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError("اسم الدورة مطلوب."); return; }
    setLoading(true);
    setError("");

    const { data: inserted, error: insertErr } = await supabase
      .from("courses")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        price: Number(price) || 0,
        trainer_id: trainerId || null,
        is_published: isPublished,
      })
      .select("id, title, description, price, discount_price, is_published, trainer_signature_url, trainer:users(full_name, email)")
      .single();

    setLoading(false);
    if (insertErr) { setError(insertErr.message); return; }

    onAdded(inserted);
    setTitle(""); setDescription(""); setPrice(""); setTrainerId(""); setIsPublished(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={handleOpen} style={{ marginBottom: 24 }}>
        + إضافة دورة جديدة
      </button>
    );
  }

  return (
    <div className="course-card-dash" style={{ marginBottom: 24, borderColor: "var(--primary)", borderWidth: 2 }}>
      <h3 style={{ marginBottom: 16 }}>إضافة دورة جديدة</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-label">
            اسم الدورة *
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مقدمة في علم النفس التربوي"
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            وصف الدورة
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نبذة عن محتوى الدورة..."
              rows={3}
              style={{ resize: "vertical" }}
            />
          </label>
        </div>
        <div className="new-course-row" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ flex: 1 }}>
            السعر (د.ك)
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.000"
            />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            المدرّب
            <select
              className="form-input"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">— بدون مدرّب —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-row" style={{ alignSelf: "flex-end", paddingBottom: 8 }}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            نشر الدورة فوراً
          </label>
        </div>
        {error && <p style={{ color: "red", margin: "8px 0" }}>{error}</p>}
        <div className="new-course-row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "حفظ الدورة"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminCourseList({ initialCourses }) {
  const [courses, setCourses] = useState(initialCourses);

  function handleDeleted(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  function handleAdded(course) {
    setCourses((prev) => [course, ...prev]);
  }

  return (
    <div>
      <AddCourseForm onAdded={handleAdded} />
      {courses.length === 0 ? (
        <p className="dash-empty">ما فيه دورات بالمنصة بعد.</p>
      ) : (
        courses.map((course) => (
          <CourseRow key={course.id} course={course} onDeleted={handleDeleted} />
        ))
      )}
    </div>
  );
}
