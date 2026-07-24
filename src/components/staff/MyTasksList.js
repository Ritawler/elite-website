"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MyTasksList({ initialTasks }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState(initialTasks);
  const [busyId, setBusyId] = useState(null);

  async function toggleDone(taskId, value) {
    setBusyId(taskId);
    const { error } = await supabase
      .from("department_tasks")
      .update({ is_done: value })
      .eq("id", taskId);
    setBusyId(null);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, is_done: value } : t)));
    }
  }

  if (tasks.length === 0) {
    return <p className="dash-empty">ما فيه مهام معيّنة لك حالياً.</p>;
  }

  return (
    <div className="dashboard-card">
      {tasks.map((t) => (
        <div className="cert-item" key={t.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={t.is_done}
                disabled={busyId === t.id}
                onChange={(e) => toggleDone(t.id, e.target.checked)}
              />
              <span style={{ textDecoration: t.is_done ? "line-through" : "none" }}>{t.title}</span>
            </label>
            {t.description && <p style={{ margin: "6px 0 0" }}>{t.description}</p>}
          </div>
          {t.due_date && <span className="cert-pending">الموعد: {t.due_date}</span>}
        </div>
      ))}
    </div>
  );
}
