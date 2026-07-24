"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ManageDepartmentsForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.from("departments").insert({ name: name.trim() });

    setLoading(false);
    if (error) {
      setError("تعذّر إضافة القسم (ممكن الاسم موجود مسبقاً).");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form className="new-course-row dashboard-card" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <input
        type="text"
        placeholder="اسم القسم الجديد (مثلاً: الموارد البشرية)"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "جارٍ الإضافة..." : "إضافة قسم"}
      </button>
    </form>
  );
}
