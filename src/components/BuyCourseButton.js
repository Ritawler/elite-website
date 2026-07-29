"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BuyCourseButton({ courseId }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState("idle"); // idle | form | loading
  const [needsGender, setNeedsGender] = useState(false);
  const [gender, setGender] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("full_name, gender")
      .eq("id", user.id)
      .single();

    setNeedsGender(!profile?.gender);
    setGender(profile?.gender || "");
    setCertificateName(profile?.full_name || "");
    setStep("form");
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");

    if (needsGender && !gender) {
      setError("اختر الجنس أولاً.");
      return;
    }
    if (!certificateName.trim()) {
      setError("اكتب الاسم اللي تبيه بالشهادة.");
      return;
    }

    setStep("loading");

    if (needsGender) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("users").update({ gender }).eq("id", user.id);
    }

    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, certificateName: certificateName.trim() }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStep("form");
      setError(data.error === "already enrolled" ? "أنت مسجّل بهذي الدورة مسبقاً." : "تعذّر بدء الدفع. حاول مرة أخرى.");
      return;
    }

    window.location.href = data.url;
  }

  if (step === "idle") {
    return (
      <div>
        {error && <div className="auth-error">{error}</div>}
        <button type="button" className="btn btn-primary" onClick={startCheckout}>
          اشترك الآن
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="dashboard-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && <div className="auth-error">{error}</div>}

      {needsGender && (
        <div className="auth-field">
          <label>الجنس</label>
          <div className="role-choice">
            <div
              className={`role-option ${gender === "male" ? "selected" : ""}`}
              onClick={() => setGender("male")}
            >
              ذكر
            </div>
            <div
              className={`role-option ${gender === "female" ? "selected" : ""}`}
              onClick={() => setGender("female")}
            >
              أنثى
            </div>
          </div>
        </div>
      )}

      <div className="auth-field">
        <label htmlFor={`cert-name-${courseId}`}>الاسم كما تريده بالشهادة</label>
        <input
          id={`cert-name-${courseId}`}
          type="text"
          required
          value={certificateName}
          onChange={(e) => setCertificateName(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={step === "loading"}>
        {step === "loading" ? "جارٍ التحويل..." : "تأكيد الاشتراك"}
      </button>
    </form>
  );
}
