"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ManageMemberTopicsList({ initialTopics }) {
  const supabase = createClient();
  const [topics, setTopics] = useState(initialTopics);

  async function handleDelete(topic) {
    if (!confirm(`حذف موضوع "${topic.title}"؟`)) return;

    if (topic.file_url) {
      const path = topic.file_url.split("/member-topics/")[1];
      if (path) await supabase.storage.from("member-topics").remove([path]);
    }

    const { error } = await supabase.from("member_topics").delete().eq("id", topic.id);
    if (!error) {
      setTopics((prev) => prev.filter((t) => t.id !== topic.id));
    }
  }

  if (topics.length === 0) {
    return <p className="dash-empty">ما فيه مواضيع منشورة بعد.</p>;
  }

  return (
    <div>
      {topics.map((topic) => (
        <div className="course-card-dash" key={topic.id}>
          <div className="course-card-dash-head">
            <div>
              <h3>{topic.title}</h3>
              {topic.body && <p>{topic.body}</p>}
              {topic.file_name && <p className="cert-pending">مرفق: {topic.file_name}</p>}
            </div>
            <button type="button" className="btn btn-outline" onClick={() => handleDelete(topic)}>
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
