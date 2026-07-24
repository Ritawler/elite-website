import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مرحباً {profile?.full_name || user.email} 👋</h1>
        <p>لوحة تحكم المدرّب</p>

        <div className="dashboard-card">
          <p>هنا راح يظهر لاحقاً عدد المشتركين بدوراتك، دخلك من كل دورة، ورسائل الطلاب.</p>
        </div>
      </div>
    </>
  );
}
