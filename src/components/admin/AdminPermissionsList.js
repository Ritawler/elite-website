"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminPermissionsList({ initialUsers }) {
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState(null);

  async function toggle(userId, value) {
    setBusyId(userId);
    const { error } = await supabase.rpc("set_can_approve_trainers", {
      target_user_id: userId,
      value,
    });
    setBusyId(null);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, can_approve_trainers: value } : u)));
    }
  }

  if (users.length === 0) {
    return <p className="dash-empty">ما فيه مستخدمين.</p>;
  }

  return (
    <div className="dashboard-card">
      {users.map((u) => (
        <div className="cert-item" key={u.id}>
          <span>
            {u.full_name || u.email} <span className="cert-pending">({u.role})</span>
          </span>
          {u.can_approve_trainers ? (
            <button
              type="button"
              className="btn btn-outline"
              disabled={busyId === u.id}
              onClick={() => toggle(u.id, false)}
            >
              إلغاء صلاحية المراجعة
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyId === u.id}
              onClick={() => toggle(u.id, true)}
            >
              منح صلاحية المراجعة
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
