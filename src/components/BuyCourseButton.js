"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BuyCourseButton({ courseId }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBuy() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error === "already enrolled" ? "أنت مسجّل بهذي الدورة مسبقاً." : "تعذّر بدء الدفع. حاول مرة أخرى.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div>
      {error && <div className="auth-error">{error}</div>}
      <button type="button" className="btn btn-primary" onClick={handleBuy} disabled={loading}>
        {loading ? "جارٍ التحويل..." : "اشترك الآن"}
      </button>
    </div>
  );
}
