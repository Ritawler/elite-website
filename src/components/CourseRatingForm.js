"use client";

import { useState } from "react";

export default function CourseRatingForm({ courseId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { setError("اختر عدد النجوم."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, rating, comment }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error || "تعذّر إرسال التقييم."); return; }
    setDone(true);
    onSubmitted?.();
  }

  if (done) {
    return (
      <div className="dashboard-card" style={{ textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontSize: 32 }}>⭐</div>
        <p style={{ margin: "8px 0 0", fontWeight: 600 }}>شكراً على تقييمك!</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h4 style={{ marginBottom: 10 }}>قيّم هذه الدورة</h4>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Star selector */}
        <div style={{ display: "flex", gap: 8, direction: "ltr" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 32, padding: 0, lineHeight: 1,
                color: star <= (hovered || rating) ? "#f5a623" : "#ccc",
                transition: "color 0.12s",
              }}
              aria-label={`${star} نجوم`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder="أضف تعليقاً (اختياري)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          style={{ resize: "vertical", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontFamily: "inherit", fontSize: 14 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: "flex-start" }}>
          {loading ? "جارٍ الإرسال..." : "إرسال التقييم"}
        </button>
      </form>
    </div>
  );
}
