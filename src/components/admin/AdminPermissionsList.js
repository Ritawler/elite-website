"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ROLES = ["student", "trainer", "staff", "admin"];

export default function AdminPermissionsList({ initialUsers }) {
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState(null);

  async function toggleApprove(userId, value) {
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

  async function toggleTopics(userId, value) {
    setBusyId(userId);
    const { error } = await supabase.rpc("set_can_manage_member_topics", {
      target_user_id: userId,
      value,
    });
    setBusyId(null);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, can_manage_member_topics: value } : u))
      );
    }
  }

  async function changeRole(userId, newRole) {
    setBusyId(userId);
    const { error } = await supabase.rpc("set_user_role", {
      target_user_id: userId,
      new_role: newRole,
    });
    setBusyId(null);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  }

  if (users.length === 0) {
    return <p className="dash-empty">ما فيه مستخدمين.</p>;
  }

  return (
    <div className="dashboard-card">
      {users.map((u) => (
        <div className="cert-item" key={u.id} style={{ flexWrap: "wrap", gap: 10 }}>
          <span>{u.full_name || u.email}</span>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={u.role}
              disabled={busyId === u.id}
              onChange={(e) => changeRole(u.id, e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid var(--border)",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {u.can_approve_trainers ? (
              <button
                type="button"
                className="btn btn-outline"
                disabled={busyId === u.id}
                onClick={() => toggleApprove(u.id, false)}
              >
                إلغاء صلاحية المراجعة
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busyId === u.id}
                onClick={() => toggleApprove(u.id, true)}
              >
                منح صلاحية المراجعة
              </button>
            )}

            {u.can_manage_member_topics ? (
              <button
                type="button"
                className="btn btn-outline"
                disabled={busyId === u.id}
                onClick={() => toggleTopics(u.id, false)}
              >
                إلغاء صلاحية المواضيع
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busyId === u.id}
                onClick={() => toggleTopics(u.id, true)}
              >
                منح صلاحية المواضيع
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
