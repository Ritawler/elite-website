"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontFamily, FontSize } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { createClient } from "@/lib/supabase/client";

const NOTE_PATH = (userId) => `${userId}/note.html`;

const FONT_FAMILIES = [
  { label: "Cairo", value: "Cairo, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

export default function StaffNoteEditor({ userId, initialContent, departmentId }) {
  const supabase = createClient();
  const [status, setStatus] = useState(""); // "saving" | "saved" | ""
  const [shareStatus, setShareStatus] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const debounceRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"], defaultAlignment: "right" }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "note-editor-content",
      },
    },
    onUpdate: ({ editor }) => {
      setStatus("saving");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(editor.getHTML()), 1500);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  async function save(html) {
    const file = new Blob([html], { type: "text/html;charset=utf-8" });
    const { error } = await supabase.storage
      .from("staff-files")
      .upload(NOTE_PATH(userId), file, { upsert: true, contentType: "text/html;charset=utf-8" });
    setStatus(error ? "" : "saved");
    if (!error) setTimeout(() => setStatus(""), 2000);
  }

  function handleDownloadTxt() {
    if (!editor) return;
    const blob = new Blob([editor.getText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "note.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf() {
    if (!editor) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/notes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: editor.getHTML() }),
      });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "note.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("تعذّر توليد ملف PDF. حاول مرة أخرى.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleShare() {
    if (!editor) return;
    setShareStatus("جارٍ المشاركة...");
    const file = new Blob([editor.getHTML()], { type: "text/html;charset=utf-8" });
    const { error } = await supabase.storage
      .from("department-files")
      .upload(`${departmentId}/note.html`, file, { upsert: true, contentType: "text/html;charset=utf-8" });
    setShareStatus(error ? "تعذّرت المشاركة" : "تمت المشاركة مع القسم ✓");
    setTimeout(() => setShareStatus(""), 2500);
  }

  if (!editor) return null;

  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 12 }}>ملاحظاتي الشخصية</h3>

      <div className="note-toolbar">
        <button
          type="button"
          className={`note-tool-btn ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={`note-tool-btn ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={`note-tool-btn ${editor.isActive("underline") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </button>

        <select
          className="note-tool-select"
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          defaultValue=""
        >
          <option value="" disabled>
            الخط
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          className="note-tool-select"
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          defaultValue=""
        >
          <option value="" disabled>
            الحجم
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s.replace("px", "")}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`note-tool-btn ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          ⇥
        </button>
        <button
          type="button"
          className={`note-tool-btn ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          ⇔
        </button>
        <button
          type="button"
          className={`note-tool-btn ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          ⇤
        </button>
      </div>

      <EditorContent editor={editor} className="note-editor" />

      <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
        {status === "saving" && "جارٍ الحفظ..."}
        {status === "saved" && "تم الحفظ تلقائياً ✓"}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-outline" onClick={handleDownloadTxt}>
          تحميل (txt)
        </button>
        <button type="button" className="btn btn-outline" onClick={handleDownloadPdf} disabled={pdfLoading}>
          {pdfLoading ? "جارٍ التحضير..." : "تحميل (PDF)"}
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
