"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CourseComments({ courseId, studentId, studentName, initialComments }) {
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        course_id: courseId,
        student_id: studentId,
        student_name: studentName,
        content: text.trim(),
      })
      .select()
      .single();

    setLoading(false);
    if (!error) {
      setComments((prev) => [...prev, data]);
      setText("");
    }
  }

  return (
    <div className="comments-box">
      {comments.length === 0 ? (
        <p className="dash-empty">لا توجد تعليقات بعد — كن أول من يعلّق.</p>
      ) : (
        comments.map((c) => (
          <div className="comment-item" key={c.id}>
            <div className="comment-meta">
              {c.student_name || "طالب"} · {new Date(c.created_at).toLocaleDateString("ar-KW")}
            </div>
            <p>{c.content}</p>
          </div>
        ))
      )}
      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="اكتب تعليقك على الدورة..."
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
