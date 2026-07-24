"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StaffFileManager({ userId, initialFiles }) {
  const supabase = createClient();
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const { error } = await supabase.storage
      .from("staff-files")
      .upload(`${userId}/${file.name}`, file, { upsert: true });

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (error) {
      setError("تعذّر رفع الملف. حاول مرة أخرى.");
      return;
    }

    setFiles((prev) => [
      { name: file.name, metadata: { size: file.size }, updated_at: new Date().toISOString() },
      ...prev.filter((f) => f.name !== file.name),
    ]);
  }

  async function handleDownload(name) {
    const { data, error } = await supabase.storage
      .from("staff-files")
      .createSignedUrl(`${userId}/${name}`, 60);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function handleDelete(name) {
    if (!confirm(`حذف الملف "${name}"؟`)) return;
    const { error } = await supabase.storage.from("staff-files").remove([`${userId}/${name}`]);
    if (!error) {
      setFiles((prev) => prev.filter((f) => f.name !== name));
    }
  }

  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 12 }}>ملفاتي الخاصة</h3>
      {error && <div className="auth-error">{error}</div>}

      <input ref={inputRef} type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p className="dash-empty">جارٍ الرفع...</p>}

      {files.length === 0 ? (
        <p className="dash-empty" style={{ marginTop: 14 }}>
          ما رفعت أي ملفات بعد.
        </p>
      ) : (
        <div style={{ marginTop: 14 }}>
          {files.map((f) => (
            <div className="cert-item" key={f.name}>
              <span>
                {f.name} <span className="cert-pending">({formatSize(f.metadata?.size)})</span>
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => handleDownload(f.name)}>
                  تحميل
                </button>
                <button type="button" className="btn btn-outline" onClick={() => handleDelete(f.name)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
