"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatPeriod(periodMonth) {
  const [year, month] = periodMonth.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminEvaluationsManager({ staffUsers, initialEvaluations, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();

  const evaluations = initialEvaluations;
  const [staffId, setStaffId] = useState(staffUsers[0]?.id || "");
  const [month, setMonth] = useState(currentMonthValue());
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!staffId || !month) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.from("staff_evaluations").insert({
      staff_id: staffId,
      period_month: `${month}-01`,
      rating: Number(rating),
      comment: comment.trim() || null,
      created_by: currentUserId,
    });

    setLoading(false);
    if (error) {
      setError(
        error.code === "23505" ? "فيه تقييم مضاف مسبقاً لهذا العضو بنفس الشهر." : "تعذّر إضافة التقييم."
      );
      return;
    }

    setComment("");
    router.refresh();
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setEditRating(ev.rating);
    setEditComment(ev.comment || "");
  }

  async function saveEdit(evId) {
    setBusyId(evId);
    const { error } = await supabase
      .from("staff_evaluations")
      .update({ rating: Number(editRating), comment: editComment.trim() || null })
      .eq("id", evId);
    setBusyId(null);
    if (!error) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function deleteEvaluation(evId) {
    setBusyId(evId);
    const { error } = await supabase.from("staff_evaluations").delete().eq("id", evId);
    setBusyId(null);
    if (!error) {
      router.refresh();
    }
  }

  if (staffUsers.length === 0) {
    return <p className="dash-empty">ما فيه أعضاء staff بعد.</p>;
  }

  return (
    <div className="dashboard-card">
      <form className="new-course-form" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        {error && <div className="auth-error">{error}</div>}

        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          required
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontFamily: "'Cairo', sans-serif" }}
        >
          {staffUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email}
            </option>
          ))}
        </select>

        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />

        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          required
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontFamily: "'Cairo', sans-serif" }}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>

        <textarea
          placeholder="ملاحظة/تعليق (اختياري)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "جارٍ الإضافة..." : "إضافة التقييم"}
        </button>
      </form>

      {evaluations.length === 0 ? (
        <p className="dash-empty">ما فيه تقييمات مضافة بعد.</p>
      ) : (
        evaluations.map((ev) => (
          <div className="cert-item" key={ev.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            {editingId === ev.id ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", fontFamily: "'Cairo', sans-serif" }}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
                <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
                <button type="button" className="btn btn-primary" disabled={busyId === ev.id} onClick={() => saveEdit(ev.id)}>
                  حفظ
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>
                  إلغاء
                </button>
              </div>
            ) : (
              <>
                <div>
                  <strong>{ev.staff_name}</strong> — {formatPeriod(ev.period_month)} — {ev.rating} / 5
                  {ev.comment && <p style={{ margin: "6px 0 0" }}>{ev.comment}</p>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-outline" disabled={busyId === ev.id} onClick={() => startEdit(ev)}>
                    تعديل
                  </button>
                  <button type="button" className="btn btn-outline" disabled={busyId === ev.id} onClick={() => deleteEvaluation(ev.id)}>
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
