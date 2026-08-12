import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SelectRoleForm from "./SelectRoleForm";

const DASHBOARD_BY_ROLE = {
  admin: "/control-panel-2026",
  staff: "/dashboard/staff",
  trainer: "/dashboard/trainer",
  student: "/dashboard/student",
};

export default async function SelectRolePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, role_selected")
    .eq("id", user.id)
    .single();

  // Already has a privileged role — mark as selected and redirect immediately.
  if (["admin", "staff", "trainer"].includes(profile?.role)) {
    if (!profile.role_selected) {
      await supabase
        .from("users")
        .update({ role_selected: true })
        .eq("id", user.id);
    }
    redirect(DASHBOARD_BY_ROLE[profile.role]);
  }

  // Already chose their role before — send to dashboard.
  if (profile?.role_selected) {
    redirect(DASHBOARD_BY_ROLE[profile?.role] ?? "/dashboard/student");
  }

  // New user with no role yet — show the selection form.
  return <SelectRoleForm />;
}
