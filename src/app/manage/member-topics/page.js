import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AddMemberTopicForm from "@/components/AddMemberTopicForm";
import ManageMemberTopicsList from "@/components/ManageMemberTopicsList";

export default async function ManageMemberTopicsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, can_manage_member_topics")
    .eq("id", user.id)
    .single();

  const canManage = profile?.role === "admin" || profile?.can_manage_member_topics === true;
  if (!canManage) redirect("/dashboard");

  const { data: topics } = await supabase
    .from("member_topics")
    .select("id, title, body, file_url, file_name, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>إدارة مواضيع الأعضاء</h1>
        <p>هذا القسم يظهر للجميع بالموقع العام — حتى لغير المسجّلين</p>

        <div className="dash-section">
          <AddMemberTopicForm userId={user.id} />
        </div>

        <div className="dash-section">
          <h2>المواضيع الحالية</h2>
          <ManageMemberTopicsList initialTopics={topics || []} />
        </div>
      </div>
    </>
  );
}
