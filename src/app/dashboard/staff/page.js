import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import StaffNoteEditor from "@/components/staff/StaffNoteEditor";
import StaffFileManager from "@/components/staff/StaffFileManager";
import DepartmentFileManager from "@/components/staff/DepartmentFileManager";
import MyTasksList from "@/components/staff/MyTasksList";
import DepartmentTasksManager from "@/components/staff/DepartmentTasksManager";
import StaffEvaluationsList from "@/components/staff/StaffEvaluationsList";

export default async function StaffDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, department_id")
    .eq("id", user.id)
    .single();

  const departmentId = profile?.department_id || null;

  const { data: departmentRow } = departmentId
    ? await supabase.from("departments").select("name").eq("id", departmentId).single()
    : { data: null };
  const departmentName = departmentRow?.name;

  const { data: noteFile } = await supabase.storage
    .from("staff-files")
    .download(`${user.id}/note.html`);
  const noteContent = noteFile ? await noteFile.text() : "";

  const { data: files } = await supabase.storage.from("staff-files").list(user.id, {
    sortBy: { column: "updated_at", order: "desc" },
  });

  const { data: departmentFiles } = departmentId
    ? await supabase.storage.from("department-files").list(departmentId, {
        sortBy: { column: "updated_at", order: "desc" },
      })
    : { data: [] };

  const { data: myTasks } = await supabase
    .from("department_tasks")
    .select("id, title, description, due_date, is_done")
    .eq("assigned_to", user.id)
    .order("due_date", { ascending: true });

  const { data: myEvaluations } = await supabase
    .from("staff_evaluations")
    .select("id, period_month, base_score, bonus_points, comment")
    .eq("staff_id", user.id)
    .order("period_month", { ascending: false });

  const { data: managedDepartments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("manager_id", user.id);

  const managedSections = [];
  for (const dept of managedDepartments || []) {
    const { data: members } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("department_id", dept.id)
      .eq("role", "staff");

    const { data: createdTasks } = await supabase
      .from("department_tasks")
      .select("id, title, is_done, assigned_to, member:users!department_tasks_assigned_to_fkey(full_name, email)")
      .eq("department_id", dept.id)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    managedSections.push({
      department: dept,
      members: members || [],
      createdTasks: (createdTasks || []).map((t) => ({
        ...t,
        assignee_name: t.member?.full_name || t.member?.email,
      })),
    });
  }

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مرحباً {profile?.full_name || user.email} 👋</h1>
        <p>لوحة تحكم الموظف {departmentName ? `— قسم ${departmentName}` : ""}</p>

        <div className="dash-section">
          <StaffFileManager userId={user.id} initialFiles={files || []} departmentId={departmentId} />
        </div>

        <div className="dash-section">
          <StaffNoteEditor userId={user.id} initialContent={noteContent} departmentId={departmentId} />
        </div>

        {departmentId && (
          <div className="dash-section">
            <DepartmentFileManager departmentId={departmentId} initialFiles={departmentFiles || []} />
          </div>
        )}

        <div className="dash-section">
          <h2>مهامي</h2>
          <MyTasksList initialTasks={myTasks || []} />
        </div>

        <div className="dash-section">
          <h2>تقييماتي الشهرية</h2>
          <StaffEvaluationsList evaluations={myEvaluations || []} />
        </div>

        {managedSections.map(({ department, members, createdTasks }) => (
          <div className="dash-section" key={department.id}>
            <DepartmentTasksManager
              department={department}
              members={members}
              createdTasks={createdTasks}
              currentUserId={user.id}
            />
          </div>
        ))}
      </div>
    </>
  );
}
