"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewCourseForm({ trainerId }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.from("courses").insert({
      trainer_id: trainerId,
      title: title.trim(),
      description: description.trim(),
      price: price ? Number(price) : 0,
      is_published: isPublished,
    });

    setLoading(false);

    if (error) {
      setError("تعذّر إضافة الدورة. حاول مرة أخرى.");
      return;
    }

    setTitle("");
    setDescription("");
    setPrice("");
    setIsPublished(false);
    router.refresh();
  }

  return (
    <form className="new-course-form dashboard-card" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 4 }}>إضافة دورة جديدة</h3>
      {error && <div className="auth-error">{error}</div>}

      <input
        type="text"
        placeholder="عنوان الدورة"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="وصف مختصر للدورة"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="new-course-row">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="السعر (د.ك)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          نشر الدورة الآن
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "جارٍ الإضافة..." : "إضافة الدورة"}
      </button>
    </form>
  );
}
