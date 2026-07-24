import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AdminPermissionsList from "@/components/admin/AdminPermissionsList";

export default async function AdminPermissionsPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, can_approve_trainers, can_manage_member_topics")
    .neq("role", "admin")
    .order("full_name", { ascending: true });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>إدارة الصلاحيات</h1>
        <p>
          غيّر دور أي حساب مباشرة (مثلاً تعيين staff)، وامنح صلاحيات "الموافقة على طلبات المدربين" أو
          "إدارة مواضيع الأعضاء" بدون إعطاء صلاحيات أدمن كاملة
        </p>

        <div className="dash-section">
          <AdminPermissionsList initialUsers={users || []} />
        </div>
      </div>
    </>
  );
}
