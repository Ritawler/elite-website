"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function buildConversations(messages, trainerId) {
  const byPartner = new Map();

  for (const m of messages) {
    const partnerId = m.sender_id === trainerId ? m.receiver_id : m.sender_id;
    if (!byPartner.has(partnerId)) {
      byPartner.set(partnerId, { partnerId, name: "مستخدم", courseId: m.course_id, messages: [] });
    }
    const convo = byPartner.get(partnerId);
    convo.messages.push(m);
    if (m.sender_id === partnerId && m.sender_name) convo.name = m.sender_name;
    convo.courseId = m.course_id;
  }

  return [...byPartner.values()].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.created_at || "";
    const bLast = b.messages[b.messages.length - 1]?.created_at || "";
    return bLast.localeCompare(aLast);
  });
}

export default function MessageInbox({ trainerId, trainerName, initialMessages }) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const conversations = useMemo(() => buildConversations(messages, trainerId), [messages, trainerId]);
  const activeConvo = conversations.find((c) => c.partnerId === selectedPartnerId) || conversations[0];

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeConvo) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        course_id: activeConvo.courseId,
        sender_id: trainerId,
        receiver_id: activeConvo.partnerId,
        sender_name: trainerName,
        content: text.trim(),
      })
      .select()
      .single();

    setLoading(false);
    if (!error) {
      setMessages((prev) => [...prev, data]);
      setText("");
    }
  }

  if (conversations.length === 0) {
    return <p className="dash-empty">ما وصلتك رسائل من الطلاب بعد.</p>;
  }

  return (
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
            <div className="preview">{c.messages[c.messages.length - 1]?.content}</div>
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
                  className={`msg-bubble ${m.sender_id === trainerId ? "mine" : "theirs"}`}
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
              <button type="submit" className="btn btn-primary" disabled={loading}>
                إرسال
              </button>
            </form>
          </>
        ) : (
          <div className="inbox-empty">اختر محادثة</div>
        )}
      </div>
    </div>
  );
}
