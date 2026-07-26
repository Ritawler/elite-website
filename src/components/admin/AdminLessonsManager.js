"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLessonsManager({ courseId, initialLessons }) {
  const router = useRouter();
  const supabase = createClient();

  const lessons = initialLessons;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bunnyVideoId, setBunnyVideoId] = useState("");
  const [orderIndex, setOrderIndex] = useState(lessons.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBunnyVideoId, setEditBunnyVideoId] = useState("");
  const [editOrderIndex, setEditOrderIndex] = useState(0);
  const [busyId, setBusyId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.from("lessons").insert({
      course_id: courseId,
      title: title.trim(),
      description: description.trim() || null,
      bunny_video_id: bunnyVideoId.trim(),
      order_index: Number(orderIndex) || 0,
    });

    setLoading(false);
    if (error) {
      setError("تعذّر إضافة الدرس.");
      return;
    }

    setTitle("");
    setDescription("");
    setBunnyVideoId("");
    setOrderIndex(lessons.length + 1);
    router.refresh();
  }

  function startEdit(lesson) {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description || "");
    setEditBunnyVideoId(lesson.bunny_video_id);
    setEditOrderIndex(lesson.order_index);
  }

  async function saveEdit(lessonId) {
    setBusyId(lessonId);
    const { error } = await supabase
      .from("lessons")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        bunny_video_id: editBunnyVideoId.trim(),
        order_index: Number(editOrderIndex) || 0,
      })
      .eq("id", lessonId);
    setBusyId(null);
    if (!error) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function deleteLesson(lessonId) {
    if (!confirm("تأكيد حذف هذا الدرس؟")) return;
    setBusyId(lessonId);
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    setBusyId(null);
    if (!error) {
      router.refresh();
    }
  }

  return (
    <div className="dashboard-card">
      <form className="new-course-form" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        {error && <div className="auth-error">{error}</div>}

        <input
          type="text"
          placeholder="عنوان الدرس"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="وصف الدرس (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Bunny Video ID"
          required
          value={bunnyVideoId}
          onChange={(e) => setBunnyVideoId(e.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="ترتيب الدرس"
          value={orderIndex}
          onChange={(e) => setOrderIndex(e.target.value)}
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "جارٍ الإضافة..." : "إضافة الدرس"}
        </button>
      </form>

      {lessons.length === 0 ? (
        <p className="dash-empty">ما فيه دروس مضافة لهذي الدورة بعد.</p>
      ) : (
        lessons.map((lesson) => (
          <div className="cert-item" key={lesson.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            {editingId === lesson.id ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="الوصف"
                />
                <input
                  type="text"
                  value={editBunnyVideoId}
                  onChange={(e) => setEditBunnyVideoId(e.target.value)}
                  placeholder="Bunny Video ID"
                />
                <input
                  type="number"
                  min="0"
                  value={editOrderIndex}
                  onChange={(e) => setEditOrderIndex(e.target.value)}
                  style={{ width: 80 }}
                />
                <button type="button" className="btn btn-primary" disabled={busyId === lesson.id} onClick={() => saveEdit(lesson.id)}>
                  حفظ
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>
                  إلغاء
                </button>
              </div>
            ) : (
              <>
                <div>
                  <strong>
                    {lesson.order_index}. {lesson.title}
                  </strong>
                  {lesson.description && <p style={{ margin: "6px 0 0" }}>{lesson.description}</p>}
                  <p style={{ margin: "4px 0 0", fontSize: "0.85em", opacity: 0.7 }}>
                    Bunny Video ID: {lesson.bunny_video_id}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-outline" disabled={busyId === lesson.id} onClick={() => startEdit(lesson)}>
                    تعديل
                  </button>
                  <button type="button" className="btn btn-outline" disabled={busyId === lesson.id} onClick={() => deleteLesson(lesson.id)}>
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
