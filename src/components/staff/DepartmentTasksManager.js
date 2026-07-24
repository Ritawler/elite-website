"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DepartmentTasksManager({ department, members, createdTasks, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();

  const [assignedTo, setAssignedTo] = useState(members[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!assignedTo) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.from("department_tasks").insert({
      department_id: department.id,
      assigned_to: assignedTo,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      created_by: currentUserId,
    });

    setLoading(false);
    if (error) {
      setError("تعذّر إضافة المهمة.");
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    router.refresh();
  }

  return (
    <div className="dashboard-card">
      <h3 style={{ marginBottom: 12 }}>إدارة مهام قسم {department.name}</h3>

      <form className="new-course-form" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        {error && <div className="auth-error">{error}</div>}

        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid var(--border)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name || m.email}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="عنوان المهمة"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="وصف المهمة (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "جارٍ الإضافة..." : "إضافة المهمة"}
        </button>
      </form>

      <h4 style={{ marginBottom: 10 }}>المهام اللي وزّعتها</h4>
      {createdTasks.length === 0 ? (
        <p className="dash-empty">ما وزّعت أي مهام بعد.</p>
      ) : (
        createdTasks.map((t) => (
          <div className="cert-item" key={t.id}>
            <span>
              {t.title} — <span className="cert-pending">{t.assignee_name || "عضو"}</span>
            </span>
            <span className={`badge ${t.is_done ? "badge-published" : "badge-draft"}`}>
              {t.is_done ? "منجزة" : "قيد الانتظار"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
