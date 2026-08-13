import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AdminPermissionsList from "@/components/admin/AdminPermissionsList";
import ManageDepartmentsForm from "@/components/admin/ManageDepartmentsForm";
import DepartmentManagerList from "@/components/admin/DepartmentManagerList";
import AdminDepartmentTaskCreator from "@/components/admin/AdminDepartmentTaskCreator";

export default async function AdminPermissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, department_id, can_approve_trainers, can_manage_member_topics")
    .neq("role", "admin")
    .order("full_name", { ascending: true });

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, manager_id")
    .order("name", { ascending: true });

  const staffUsers = (users || []).filter((u) => u.role === "staff");

  const { data: createdTasksRaw } = await supabase
    .from("department_tasks")
    .select(
      "id, title, is_done, department_id, assigned_to, department:departments(name), member:users!department_tasks_assigned_to_fkey(full_name, email)"
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const createdTasks = (createdTasksRaw || []).map((t) => ({
    ...t,
    department_name: t.department?.name,
    assignee_name: t.member?.full_name || t.member?.email,
  }));

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>إدارة الصلاحيات</h1>
        <p>
          غيّر دور أي حساب مباشرة (مثلاً تعيين staff)، عيّن قسم كل موظف، وامنح صلاحيات "الموافقة على طلبات
          المدربين" أو "إدارة مواضيع الأعضاء" بدون إعطاء صلاحيات أدمن كاملة
        </p>

        <div className="dash-section">
          <h2>الأقسام</h2>
          <ManageDepartmentsForm />
        </div>

        <div className="dash-section">
          <h2>مسؤول كل قسم</h2>
          <p>مسؤول القسم يقدر يضيف مهام لأعضاء قسمه فقط</p>
          <DepartmentManagerList initialDepartments={departments || []} staffUsers={staffUsers} />
        </div>

        <div className="dash-section">
          <h2>إضافة مهمة لأي قسم</h2>
          <p>كأدمن تقدر تضيف مهمة لأي عضو بأي قسم مباشرة، بدون ما تصير مسؤول رسمي على ذاك القسم</p>
          <AdminDepartmentTaskCreator
            departments={departments || []}
            staffUsers={staffUsers}
            createdTasks={createdTasks}
            currentUserId={user.id}
          />
        </div>

        <div className="dash-section">
          <AdminPermissionsList initialUsers={users || []} departments={departments || []} />
        </div>
      </div>
    </>
  );
}
