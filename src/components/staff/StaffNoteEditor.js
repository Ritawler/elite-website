"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function StaffNoteEditor({ userId, initialContent }) {
  const supabase = createClient();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("staff_notes")
      .upsert({ user_id: userId, content, updated_at: new Date().toISOString() });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 12 }}>ملاحظاتي الشخصية</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب أي شي تبي ترجع له لاحقاً..."
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
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ"}
        </button>
      </div>
    </div>
  );
}
