import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AdminEvaluationsManager from "@/components/admin/AdminEvaluationsManager";

export default async function AdminEvaluationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .eq("role", "staff")
    .order("full_name", { ascending: true });

  const staffUsers = users || [];

  const { data: evaluationsRaw } = await supabase
    .from("staff_evaluations")
    .select("id, staff_id, period_month, rating, comment, staff:users!staff_evaluations_staff_id_fkey(full_name, email)")
    .order("period_month", { ascending: false });

  const evaluations = (evaluationsRaw || []).map((ev) => ({
    ...ev,
    staff_name: ev.staff?.full_name || ev.staff?.email,
  }));

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>التقييم الشهري لأعضاء الفريق</h1>
        <p>الأدمن فقط يقدر يضيف/يعدّل/يحذف تقييم — كل عضو يشوف تقييماته هو بس من لوحته</p>

        <div className="dash-section">
          <AdminEvaluationsManager staffUsers={staffUsers} initialEvaluations={evaluations} currentUserId={user.id} />
        </div>
      </div>
    </>
  );
}
