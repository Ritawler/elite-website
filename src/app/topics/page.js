import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";

export default async function MemberTopicsPage() {
  const supabase = await createClient();

  const { data: topics } = await supabase
    .from("member_topics")
    .select("id, title, body, file_url, file_name, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مواضيع الأعضاء</h1>
        <p>محتوى ومرفقات تهمّ أعضاء إيليت وزوّار الموقع</p>

        <div className="dash-section">
          {!topics || topics.length === 0 ? (
            <p className="dash-empty">ما فيه مواضيع منشورة حالياً.</p>
          ) : (
            topics.map((topic) => (
              <div className="course-card-dash" key={topic.id}>
                <h3>{topic.title}</h3>
                {topic.body && <p>{topic.body}</p>}
                {topic.file_url && (
                  <a
                    href={topic.file_url}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-outline"
                    style={{ marginTop: 10 }}
                  >
                    تحميل {topic.file_name ? `(${topic.file_name})` : "المرفق"}
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
