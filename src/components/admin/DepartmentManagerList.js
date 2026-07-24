"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DepartmentManagerList({ initialDepartments, staffUsers }) {
  const supabase = createClient();
  const [departments, setDepartments] = useState(initialDepartments);
  const [busyId, setBusyId] = useState(null);

  async function changeManager(deptId, managerId) {
    setBusyId(deptId);
    const { error } = await supabase.rpc("set_department_manager", {
      dept_id: deptId,
      manager_user_id: managerId || null,
    });
    setBusyId(null);
    if (!error) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === deptId ? { ...d, manager_id: managerId || null } : d))
      );
    }
  }

  if (departments.length === 0) {
    return <p className="dash-empty">ما فيه أقسام بعد.</p>;
  }

  return (
    <div className="dashboard-card">
      {departments.map((d) => {
        const membersOfDept = staffUsers.filter((u) => u.department_id === d.id);
        return (
          <div className="cert-item" key={d.id}>
            <span>{d.name}</span>
            <select
              value={d.manager_id || ""}
              disabled={busyId === d.id}
              onChange={(e) => changeManager(d.id, e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid var(--border)",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              <option value="">بدون مسؤول</option>
              {membersOfDept.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
