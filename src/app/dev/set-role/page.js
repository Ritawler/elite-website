// ============================================================
// !! TEMPORARY DEV-ONLY TESTING PATH — DO NOT SHIP TO PRODUCTION !!
// Lets any logged-in user change their own role (or grant the
// can_approve_trainers permission to any email) directly, bypassing the
// trainer request/approval flow entirely. This exists only because there
// is no real admin account yet to bootstrap the system during development.
// This route is not linked from any nav menu — only reachable by typing
// the URL directly. MUST be deleted before the public launch — see the
// checklist in CLAUDE.md ("وضع مؤقت أثناء التطوير").
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DevSetRolePage() {
  const router = useRouter();
  const supabase = createClient();

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function setOwnRole(role) {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.rpc("dev_set_own_role", { new_role: role });
    setLoading(false);
    if (error) {
      setMessage("خطأ: " + error.message);
      return;
    }
    setMessage(`تم تغيير دورك إلى "${role}". بروح لداشبوردك الآن...`);
    router.push("/dashboard");
    router.refresh();
  }

  async function grantApprover(value) {
    if (!email.trim()) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.rpc("dev_set_can_approve_trainers_by_email", {
      target_email: email.trim(),
      value,
    });
    setLoading(false);
    setMessage(
      error
        ? "خطأ: " + error.message
        : `تم ${value ? "منح" : "إلغاء"} صلاحية المراجعة لـ ${email}`
    );
  }

  return (
    <div className="dashboard-wrap">
      <div className="auth-error" style={{ marginBottom: 24 }}>
        ⚠️ هذي صفحة اختبار مؤقتة للتطوير فقط — لازم تُحذف قبل إطلاق الموقع للجمهور.
      </div>

      <h1>أداة تطوير: تغيير الدور</h1>

      {message && <div className="auth-success">{message}</div>}

      <div className="dashboard-card">
        <h3 style={{ marginBottom: 12 }}>غيّر دور حسابك الحالي</h3>
        <div className="new-course-row">
          <button className="btn btn-outline" disabled={loading} onClick={() => setOwnRole("student")}>
            student
          </button>
          <button className="btn btn-outline" disabled={loading} onClick={() => setOwnRole("trainer")}>
            trainer
          </button>
          <button className="btn btn-outline" disabled={loading} onClick={() => setOwnRole("admin")}>
            admin
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <h3 style={{ marginBottom: 12 }}>امنح صلاحية مراجعة طلبات المدربين لإيميل معيّن</h3>
        <div className="new-course-row">
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1.5px solid var(--border)",
              fontFamily: "'Cairo', sans-serif",
            }}
          />
          <button className="btn btn-primary" disabled={loading} onClick={() => grantApprover(true)}>
            منح الصلاحية
          </button>
          <button className="btn btn-outline" disabled={loading} onClick={() => grantApprover(false)}>
            إلغاء الصلاحية
          </button>
        </div>
      </div>
    </div>
  );
}
