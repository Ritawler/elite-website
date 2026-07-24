import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import StaffNoteEditor from "@/components/staff/StaffNoteEditor";
import StaffFileManager from "@/components/staff/StaffFileManager";
import DepartmentFileManager from "@/components/staff/DepartmentFileManager";

export default async function StaffDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, department_id, departments(name)")
    .eq("id", user.id)
    .single();

  const departmentId = profile?.department_id || null;
  const departmentName = profile?.departments?.name;

  const { data: noteFile } = await supabase.storage
    .from("staff-files")
    .download(`${user.id}/note.txt`);
  const noteContent = noteFile ? await noteFile.text() : "";

  const { data: files } = await supabase.storage.from("staff-files").list(user.id, {
    sortBy: { column: "updated_at", order: "desc" },
  });

  const { data: departmentFiles } = departmentId
    ? await supabase.storage.from("department-files").list(departmentId, {
        sortBy: { column: "updated_at", order: "desc" },
      })
    : { data: [] };

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
      </div>
    </>
  );
}
