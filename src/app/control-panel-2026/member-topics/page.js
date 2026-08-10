import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Link from "next/link";
import AdminMemberTopicsManager from "@/components/admin/AdminMemberTopicsManager";

export default async function AdminMemberTopicsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: topics } = await supabase
    .from("member_topics")
    .select("id, title, author_name, published_at, pdf_url, created_at")
    .order("published_at", { ascending: false });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <div style={{ marginBottom: 16 }}>
          <Link href="/control-panel-2026" className="btn btn-outline" style={{ fontSize: "0.9rem" }}>
            ← لوحة الأدمن
          </Link>
        </div>
        <h1>إدارة مواضيع الأعضاء</h1>
        <p>أضف أو احذف مواضيع ومقالات PDF تظهر في قسم "مواضيع الأعضاء" بالموقع</p>
        <AdminMemberTopicsManager initialTopics={topics || []} />
      </div>
    </>
  );
}
