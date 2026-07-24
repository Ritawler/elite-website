"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrainerRequestBox({ studentId, studentName, studentEmail, initialRequest }) {
  const supabase = createClient();
  const [request, setRequest] = useState(initialRequest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("trainer_requests")
      .insert({
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      setError("تعذّر إرسال الطلب. حاول مرة أخرى.");
      return;
    }
    setRequest(data);
  }

  return (
    <div className="dash-section">
      <h2>تصير مدرّب؟</h2>
      <div className="dashboard-card">
        {error && <div className="auth-error">{error}</div>}

        {!request && (
          <>
            <p>تقدر تطلب ترقية حسابك ليصير حساب مدرّب. الطلب يحتاج موافقة قبل ما يتفعّل.</p>
            <button type="button" className="btn btn-primary" onClick={handleApply} disabled={loading}>
              {loading ? "جارٍ الإرسال..." : "تقديم طلب"}
            </button>
          </>
        )}

        {request?.status === "pending" && (
          <p>
            طلبك قيد المراجعة حالياً — بتوصلك ترقية تلقائية للوحة تحكم المدرّب أول ما توافق جهة مخوّلة.
          </p>
        )}

        {request?.status === "rejected" && (
          <>
            <p>تم رفض طلبك السابق. تقدر تعيد التقديم.</p>
            <button type="button" className="btn btn-outline" onClick={handleApply} disabled={loading}>
              {loading ? "جارٍ الإرسال..." : "إعادة التقديم"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
