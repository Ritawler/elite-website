"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function CourseLessons({ lessons, initialCompletedIds = [] }) {
  const [openLessonId, setOpenLessonId] = useState(null);
  const [embedUrl, setEmbedUrl] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [completedIds, setCompletedIds] = useState(new Set(initialCompletedIds));
  const [videoEndedIds, setVideoEndedIds] = useState(new Set());
  const [markingId, setMarkingId] = useState(null);

  const iframeRef = useRef(null);
  const playerRef = useRef(null);

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

  // Wires up Bunny's Player.js so we can detect when the video actually
  // finishes — the player is a cross-origin iframe, so a plain <video
  // onEnded> handler has nothing to attach to.
  useEffect(() => {
    if (!openLessonId || !embedUrl || !iframeRef.current) return;

    let cancelled = false;

    function attach() {
      if (cancelled || !window.playerjs || !iframeRef.current) return;
      const player = new window.playerjs.Player(iframeRef.current);
      playerRef.current = player;
      player.on("ended", () => {
        setVideoEndedIds((prev) => new Set(prev).add(openLessonId));
      });
    }

    if (window.playerjs) {
      attach();
    } else {
      const interval = setInterval(() => {
        if (window.playerjs) {
          clearInterval(interval);
          attach();
        }
      }, 300);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [openLessonId, embedUrl]);

  async function markComplete(lessonId) {
    setMarkingId(lessonId);
    const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setMarkingId(null);
    if (res.ok || json.completed) {
      setCompletedIds((prev) => new Set(prev).add(lessonId));
    }
    if (json.certificateIssued) {
      setError("🎉 تهانينا! تم إصدار شهادتك. يمكنك تحميلها من قسم 'شهاداتي'.");
    } else if (json.error && !json.certificateIssued && json.completed) {
      setError(`تعذّر إصدار الشهادة: ${json.error}`);
    }
  }

  if (lessons.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <Script src="https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js" strategy="afterInteractive" />
      <h4 style={{ marginBottom: 10 }}>الدروس</h4>
      {error && <div className="auth-error">{error}</div>}

      {lessons.map((lesson) => {
        const isCompleted = completedIds.has(lesson.id);
        const canMarkComplete = isCompleted || videoEndedIds.has(lesson.id);
        return (
          <div key={lesson.id} className="cert-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{lesson.title}</strong>
                {lesson.description && <p style={{ margin: "4px 0 0" }}>{lesson.description}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: canMarkComplete ? 1 : 0.5,
                  color: isCompleted ? "#4a9e4a" : "inherit",
                  fontWeight: isCompleted ? 600 : "normal",
                  cursor: isCompleted ? "default" : "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    readOnly={isCompleted}
                    disabled={!canMarkComplete || markingId === lesson.id}
                    onChange={isCompleted ? undefined : () => markComplete(lesson.id)}
                    style={{ accentColor: "#4a9e4a", width: 16, height: 16, cursor: isCompleted ? "default" : "pointer" }}
                  />
                  {isCompleted ? "✓ تم إنهاء مشاهدة هذا الدرس" : "أنهيت مشاهدة هذا الدرس"}
                </label>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={loadingId === lesson.id}
                  onClick={() => playLesson(lesson.id)}
                >
                  {loadingId === lesson.id ? "..." : openLessonId === lesson.id ? "إغلاق" : "تشغيل"}
                </button>
              </div>
            </div>

            {openLessonId === lesson.id && embedUrl && (
              <div style={{ position: "relative", paddingTop: "56.25%" }}>
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  loading="lazy"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
