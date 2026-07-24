"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddMemberTopicForm({ userId }) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let fileUrl = null;
    let fileName = null;
    const file = fileRef.current?.files?.[0];

    if (file) {
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("member-topics")
        .upload(path, file);

      if (uploadError) {
        setLoading(false);
        setError("تعذّر رفع الملف المرفق.");
        return;
      }

      fileUrl = supabase.storage.from("member-topics").getPublicUrl(path).data.publicUrl;
      fileName = file.name;
    }

    const { error: insertError } = await supabase.from("member_topics").insert({
      title: title.trim(),
      body: body.trim() || null,
      file_url: fileUrl,
      file_name: fileName,
      created_by: userId,
    });

    setLoading(false);

    if (insertError) {
      setError("تعذّر إضافة الموضوع.");
      return;
    }

    setTitle("");
    setBody("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <form className="new-course-form dashboard-card" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 4 }}>إضافة موضوع جديد</h3>
      {error && <div className="auth-error">{error}</div>}

      <input
        type="text"
        placeholder="عنوان الموضوع"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="نص الموضوع (اختياري)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <input ref={fileRef} type="file" />

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "جارٍ الإضافة..." : "نشر الموضوع"}
      </button>
    </form>
  );
}
