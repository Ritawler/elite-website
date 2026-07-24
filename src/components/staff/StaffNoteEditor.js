"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NOTE_PATH = (userId) => `${userId}/note.txt`;

export default function StaffNoteEditor({ userId, initialContent, departmentId }) {
  const supabase = createClient();
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(""); // "saving" | "saved" | ""
  const [shareStatus, setShareStatus] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setContent(value);
    setStatus("saving");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(value), 1500);
  }

  async function save(value) {
    const file = new Blob([value], { type: "text/plain;charset=utf-8" });
    const { error } = await supabase.storage
      .from("staff-files")
      .upload(NOTE_PATH(userId), file, { upsert: true, contentType: "text/plain;charset=utf-8" });
    setStatus(error ? "" : "saved");
    if (!error) setTimeout(() => setStatus(""), 2000);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "note.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    setShareStatus("جارٍ المشاركة...");
    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    const { error } = await supabase.storage
      .from("department-files")
      .upload(`${departmentId}/note.txt`, file, { upsert: true, contentType: "text/plain;charset=utf-8" });
    setShareStatus(error ? "تعذّرت المشاركة" : "تمت المشاركة مع القسم ✓");
    setTimeout(() => setShareStatus(""), 2500);
  }

  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 12 }}>ملاحظاتي الشخصية</h3>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="اكتب أي شي تبي ترجع له لاحقاً... (يُحفظ تلقائياً)"
        style={{
          width: "100%",
          minHeight: 260,
          padding: "14px 16px",
          borderRadius: "10px",
          border: "1.5px solid var(--border)",
          fontFamily: "'Cairo', sans-serif",
          fontSize: 15,
          resize: "vertical",
        }}
      />
      <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
        {status === "saving" && "جارٍ الحفظ..."}
        {status === "saved" && "تم الحفظ تلقائياً ✓"}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-outline" onClick={handleDownload}>
          تحميل (txt)
        </button>
        {departmentId && (
          <button type="button" className="btn btn-outline" onClick={handleShare}>
            مشاركة مع القسم
          </button>
        )}
        {shareStatus && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{shareStatus}</span>}
      </div>
    </div>
  );
}
