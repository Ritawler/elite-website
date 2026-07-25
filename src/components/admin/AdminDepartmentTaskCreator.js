"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDepartmentTaskCreator({ departments, staffUsers, createdTasks, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();

  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const membersOfDept = staffUsers.filter((u) => u.department_id === departmentId);

  const [assignedTo, setAssignedTo] = useState(membersOfDept[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleDeptChange(e) {
    const newDeptId = e.target.value;
    setDepartmentId(newDeptId);
    const firstMember = staffUsers.find((u) => u.department_id === newDeptId);
    setAssignedTo(firstMember?.id || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!departmentId || !assignedTo) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.from("department_tasks").insert({
      department_id: departmentId,
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

  if (departments.length === 0) {
    return <p className="dash-empty">ما فيه أقسام بعد.</p>;
  }

  return (
    <div className="dashboard-card">
      <form className="new-course-form" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        {error && <div className="auth-error">{error}</div>}

        <select
          value={departmentId}
          onChange={handleDeptChange}
          required
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1.5px solid var(--border)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

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
          {membersOfDept.length === 0 && <option value="">-- ما فيه أعضاء بهذا القسم --</option>}
          {membersOfDept.map((m) => (
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

        <button type="submit" className="btn btn-primary" disabled={loading || !assignedTo}>
          {loading ? "جارٍ الإضافة..." : "إضافة المهمة"}
        </button>
      </form>

      <h4 style={{ marginBottom: 10 }}>المهام اللي وزّعتها بنفسك</h4>
      {createdTasks.length === 0 ? (
        <p className="dash-empty">ما وزّعت أي مهام بعد.</p>
      ) : (
        createdTasks.map((t) => (
          <div className="cert-item" key={t.id}>
            <span>
              {t.title} — <span className="cert-pending">{t.department_name} · {t.assignee_name || "عضو"}</span>
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
