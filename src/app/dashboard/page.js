import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  if (!profile?.role_selected) redirect("/auth/select-role");
  redirect(`/dashboard/${profile.role}`);
}
