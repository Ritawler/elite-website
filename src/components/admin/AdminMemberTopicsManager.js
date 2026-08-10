"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminMemberTopicsManager({ initialTopics }) {
  const supabase = createClient();
  const [topics, setTopics] = useState(initialTopics);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10));
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !authorName.trim() || !pdfFile) {
      setError("يرجى ملء جميع الحقول ورفع ملف PDF.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const ext = pdfFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("member-topics")
        .upload(fileName, pdfFile, { contentType: "application/pdf" });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("member-topics")
        .getPublicUrl(fileName);

      const { data: inserted, error: insertErr } = await supabase
        .from("member_topics")
        .insert({ title: title.trim(), author_name: authorName.trim(), published_at: publishedAt, pdf_url: urlData.publicUrl })
        .select("id, title, author_name, published_at, pdf_url, created_at")
        .single();

      if (insertErr) throw insertErr;

      setTopics([inserted, ...topics]);
      setTitle("");
      setAuthorName("");
      setPublishedAt(new Date().toISOString().slice(0, 10));
      setPdfFile(null);
      setSuccess("تمت إضافة الموضوع بنجاح.");
      e.target.reset();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(topic) {
    if (!confirm(`هل تريد حذف الموضوع "${topic.title}"؟`)) return;

    const fileName = topic.pdf_url.split("/").pop();
    await supabase.storage.from("member-topics").remove([fileName]);
    await supabase.from("member_topics").delete().eq("id", topic.id);
    setTopics(topics.filter((t) => t.id !== topic.id));
  }

  return (
    <div>
      <div className="dash-section">
        <h2>إضافة موضوع جديد</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <label className="form-label">
              عنوان الموضوع
              <input
                className="form-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مفاهيم أساسية في علم النفس"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              اسم صاحب الموضوع
              <input
                className="form-input"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: د. محمد الهلال"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              تاريخ النشر
              <input
                className="form-input"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              ملف PDF
              <input
                className="form-input"
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0] || null)}
                required
              />
            </label>
          </div>
          {error && <p style={{ color: "red", margin: "8px 0" }}>{error}</p>}
          {success && <p style={{ color: "green", margin: "8px 0" }}>{success}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "جارٍ الرفع..." : "إضافة الموضوع"}
          </button>
        </form>
      </div>

      <div className="dash-section">
        <h2>المواضيع الحالية ({topics.length})</h2>
        {topics.length === 0 ? (
          <p className="dash-empty">ما فيه مواضيع بعد.</p>
        ) : (
          <div className="dashboard-card">
            {topics.map((t) => (
              <div key={t.id} className="cert-item" style={{ alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block" }}>{t.title}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {t.author_name} — {t.published_at}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a href={t.pdf_url} target="_blank" rel="noopener" className="btn btn-outline" style={{ fontSize: "0.82rem", padding: "6px 14px" }}>
                    معاينة
                  </a>
                  <button
                    className="btn"
                    style={{ background: "#fee2e2", color: "#dc2626", border: "none", fontSize: "0.82rem", padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}
                    onClick={() => handleDelete(t)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
