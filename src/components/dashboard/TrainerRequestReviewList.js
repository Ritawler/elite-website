"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrainerRequestReviewList({ initialRequests }) {
  const supabase = createClient();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function handleReview(requestId, approve) {
    setBusyId(requestId);
    setError("");

    const { error } = await supabase.rpc("review_trainer_request", {
      request_id: requestId,
      approve,
    });

    setBusyId(null);
    if (error) {
      setError("تعذّر تنفيذ العملية: " + error.message);
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: approve ? "approved" : "rejected" } : r))
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <div>
      {error && <div className="auth-error">{error}</div>}

      <div className="dash-section">
        <h2>طلبات بانتظار المراجعة</h2>
        {pending.length === 0 ? (
          <p className="dash-empty">ما فيه طلبات معلّقة حالياً.</p>
        ) : (
          pending.map((r) => (
            <div className="course-card-dash" key={r.id}>
              <div className="course-card-dash-head">
                <div>
                  <h3>{r.student_name || "طالب"}</h3>
                  <p>{r.student_email}</p>
                </div>
              </div>
              <div className="new-course-row" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busyId === r.id}
                  onClick={() => handleReview(r.id, true)}
                >
                  موافقة
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busyId === r.id}
                  onClick={() => handleReview(r.id, false)}
                >
                  رفض
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="dash-section">
        <h2>سجلّ الطلبات السابقة</h2>
        {reviewed.length === 0 ? (
          <p className="dash-empty">ما فيه طلبات تمت مراجعتها بعد.</p>
        ) : (
          <div className="dashboard-card">
            {reviewed.map((r) => (
              <div className="cert-item" key={r.id}>
                <span>{r.student_name || "طالب"}</span>
                <span className={`badge ${r.status === "approved" ? "badge-published" : "badge-draft"}`}>
                  {r.status === "approved" ? "تمت الموافقة" : "مرفوض"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
