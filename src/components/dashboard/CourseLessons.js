"use client";

import { useState } from "react";

export default function CourseLessons({ lessons }) {
  const [openLessonId, setOpenLessonId] = useState(null);
  const [embedUrl, setEmbedUrl] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  async function playLesson(lessonId) {
    if (openLessonId === lessonId) {
      setOpenLessonId(null);
      setEmbedUrl("");
      return;
    }

    setLoadingId(lessonId);
    setError("");

    const res = await fetch(`/api/lessons/${lessonId}/playback`, { method: "POST" });
    const data = await res.json();

    setLoadingId(null);
    if (!res.ok) {
      setError(data?.error || "تعذّر تشغيل الفيديو.");
      return;
    }

    setOpenLessonId(lessonId);
    setEmbedUrl(data.embedUrl);
  }

  if (lessons.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <h4 style={{ marginBottom: 10 }}>الدروس</h4>
      {error && <div className="auth-error">{error}</div>}

      {lessons.map((lesson) => (
        <div key={lesson.id} className="cert-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div>
              <strong>{lesson.title}</strong>
              {lesson.description && <p style={{ margin: "4px 0 0" }}>{lesson.description}</p>}
            </div>
            <button
              type="button"
              className="btn btn-outline"
              disabled={loadingId === lesson.id}
              onClick={() => playLesson(lesson.id)}
            >
              {loadingId === lesson.id ? "..." : openLessonId === lesson.id ? "إغلاق" : "تشغيل"}
            </button>
          </div>

          {openLessonId === lesson.id && embedUrl && (
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={embedUrl}
                loading="lazy"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
