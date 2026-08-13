"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function buildConversations(messages, adminId) {
  const byPartner = new Map();
  for (const m of messages) {
    const partnerId = m.sender_id === adminId ? m.receiver_id : m.sender_id;
    const partnerName =
      m.sender_id === partnerId
        ? (m.sender?.full_name || m.sender_name || "مستخدم")
        : (m.receiver?.full_name || "مستخدم");
    if (!byPartner.has(partnerId)) {
      byPartner.set(partnerId, { partnerId, name: partnerName, messages: [] });
    }
    const c = byPartner.get(partnerId);
    c.messages.push(m);
    if (partnerName !== "مستخدم") c.name = partnerName;
  }
  return [...byPartner.values()].sort((a, b) => {
    const aL = a.messages.at(-1)?.created_at || "";
    const bL = b.messages.at(-1)?.created_at || "";
    return bL.localeCompare(aL);
  });
}

export default function AdminMessagingPanel({ adminId, adminName, initialMessages }) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // New conversation
  const [showNew, setShowNew] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newReceiverId, setNewReceiverId] = useState("");
  const [newText, setNewText] = useState("");
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");

  const conversations = useMemo(() => buildConversations(messages, adminId), [messages, adminId]);
  const activeConvo =
    conversations.find((c) => c.partnerId === selectedPartnerId) || conversations[0];

  async function loadUsers() {
    setLoadingUsers(true);
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .neq("id", adminId)
      .order("full_name");
    setUsers(data || []);
    setLoadingUsers(false);
  }

  function handleOpenNew() {
    setShowNew(true);
    if (users.length === 0) loadUsers();
  }

  async function handleSendNew(e) {
    e.preventDefault();
    if (!newReceiverId || !newText.trim()) { setNewError("اختر المستلم واكتب رسالة."); return; }
    setNewLoading(true);
    setNewError("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        course_id: null,
        sender_id: adminId,
        receiver_id: newReceiverId,
        sender_name: adminName,
        content: newText.trim(),
      })
      .select("*, sender:users!sender_id(full_name), receiver:users!receiver_id(full_name)")
      .single();

    setNewLoading(false);
    if (error) { setNewError("تعذّر الإرسال: " + error.message); return; }

    setMessages((prev) => [...prev, data]);
    setSelectedPartnerId(newReceiverId);
    setNewText(""); setNewReceiverId(""); setShowNew(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeConvo) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        course_id: null,
        sender_id: adminId,
        receiver_id: activeConvo.partnerId,
        sender_name: adminName,
        content: text.trim(),
      })
      .select("*, sender:users!sender_id(full_name), receiver:users!receiver_id(full_name)")
      .single();

    setLoading(false);
    if (!error) { setMessages((prev) => [...prev, data]); setText(""); }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={handleOpenNew}>+ محادثة جديدة</button>
      </div>

      {showNew && (
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12 }}>إرسال رسالة لمستخدم</h4>
          {newError && <div className="auth-error">{newError}</div>}
          <form onSubmit={handleSendNew} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select
              value={newReceiverId}
              onChange={(e) => setNewReceiverId(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontFamily: "inherit" }}
              disabled={loadingUsers}
            >
              <option value="">{loadingUsers ? "جارٍ التحميل..." : "— اختر المستلم —"}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.role})
                </option>
              ))}
            </select>
            <textarea
              placeholder="اكتب رسالتك..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={3}
              style={{ resize: "vertical", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={newLoading}>
                {newLoading ? "جارٍ الإرسال..." : "إرسال"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowNew(false)}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {conversations.length === 0 && !showNew ? (
        <p className="dash-empty">ما فيه محادثات بعد. ابدأ محادثة جديدة.</p>
      ) : conversations.length > 0 ? (
        <div className="inbox-layout">
          <div className="inbox-list">
            {conversations.map((c) => (
              <button
                key={c.partnerId}
                type="button"
                className={`inbox-list-item ${activeConvo?.partnerId === c.partnerId ? "active" : ""}`}
                onClick={() => setSelectedPartnerId(c.partnerId)}
              >
                <div className="name">{c.name}</div>
                <div className="preview">{c.messages.at(-1)?.content}</div>
              </button>
            ))}
          </div>

          <div className="inbox-thread">
            {activeConvo ? (
              <>
                <div className="inbox-thread-messages">
                  {activeConvo.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`msg-bubble ${m.sender_id === adminId ? "mine" : "theirs"}`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                <form className="inbox-thread-form" onSubmit={handleSend}>
                  <textarea
                    placeholder="اكتب ردّك..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>إرسال</button>
                </form>
              </>
            ) : (
              <div className="inbox-empty">اختر محادثة</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
