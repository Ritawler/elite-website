import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AdminPermissionsList from "@/components/admin/AdminPermissionsList";

export default async function AdminPermissionsPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, can_approve_trainers")
    .neq("role", "admin")
    .order("full_name", { ascending: true });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>إدارة الصلاحيات</h1>
        <p>امنح صلاحية "الموافقة على طلبات المدربين" لأي حساب بدون إعطائه صلاحيات أدمن كاملة</p>

        <div className="dash-section">
          <AdminPermissionsList initialUsers={users || []} />
        </div>
      </div>
    </>
  );
}
