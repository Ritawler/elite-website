"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SelectRolePage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("users")
      .update({ role, role_selected: true })
      .eq("id", user.id);

    if (error) {
      setError("تعذّر حفظ الاختيار. حاول مرة أخرى.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/${role}`);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>اختر نوع حسابك</h1>
        <p className="auth-subtitle">هذه الخطوة الأخيرة قبل الدخول للمنصة</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="role-choice">
          <div
            className={`role-option ${role === "student" ? "selected" : ""}`}
            onClick={() => setRole("student")}
          >
            متدرّب (Student)
          </div>
          <div
            className={`role-option ${role === "trainer" ? "selected" : ""}`}
            onClick={() => setRole("trainer")}
          >
            مدرّب (Trainer)
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary auth-submit"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "جارٍ الحفظ..." : "متابعة"}
        </button>
      </div>
    </div>
  );
}
