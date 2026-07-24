"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CourseMessageThread({
  courseId,
  trainerId,
  studentId,
  studentName,
  initialMessages,
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(initialMessages.length > 0);
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        course_id: courseId,
        sender_id: studentId,
        receiver_id: trainerId,
        sender_name: studentName,
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

  if (!open) {
    return (
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)}>
        راسل المدرّب
      </button>
    );
  }

  return (
    <div className="comments-box">
      {messages.length === 0 ? (
        <p className="dash-empty">ما بعد راسلت المدرّب عن هذي الدورة.</p>
      ) : (
        messages.map((m) => (
          <div
            key={m.id}
            className={`msg-bubble ${m.sender_id === studentId ? "mine" : "theirs"}`}
          >
            {m.content}
          </div>
        ))
      )}
      <form className="comment-form" onSubmit={handleSend}>
        <textarea
          placeholder="اكتب رسالتك للمدرّب..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          إرسال
        </button>
      </form>
    </div>
  );
}
