import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import StaffNoteEditor from "@/components/staff/StaffNoteEditor";
import StaffFileManager from "@/components/staff/StaffFileManager";

export default async function StaffDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: note } = await supabase
    .from("staff_notes")
    .select("content")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: files } = await supabase.storage.from("staff-files").list(user.id, {
    sortBy: { column: "updated_at", order: "desc" },
  });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مرحباً {profile?.full_name || user.email} 👋</h1>
        <p>لوحة تحكم الموظف</p>

        <div className="dash-section">
          <StaffFileManager userId={user.id} initialFiles={files || []} />
        </div>

        <div className="dash-section">
          <StaffNoteEditor userId={user.id} initialContent={note?.content || ""} />
        </div>
      </div>
    </>
  );
}
