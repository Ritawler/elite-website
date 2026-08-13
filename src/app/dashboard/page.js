import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, role_selected")
    .eq("id", user.id)
    .single();

  // Auto-assign student for new users (Google OAuth or unfinished registration)
  if (!profile?.role_selected) {
    const admin = createAdminClient();
    await admin
      .from("users")
      .update({ role: "student", role_selected: true })
      .eq("id", user.id);
    redirect("/dashboard/student");
  }

  if (profile.role === "admin") redirect("/control-panel-2026");
  redirect(`/dashboard/${profile.role}`);
}
