import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import TrainerRequestReviewList from "@/components/dashboard/TrainerRequestReviewList";

export default async function TrainerRequestsReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, can_approve_trainers")
    .eq("id", user.id)
    .single();

  const canReview = profile?.role === "admin" || profile?.can_approve_trainers === true;
  if (!canReview) redirect("/dashboard");

  const { data: requests } = await supabase
    .from("trainer_requests")
    .select("id, student_name, student_email, status, requested_at")
    .order("requested_at", { ascending: false });

  return (
    <>
      <Header />
      <div className="dashboard-wrap">
        <h1>مراجعة طلبات المدربين</h1>
        <p>موافقة أو رفض طلبات ترقية الحسابات إلى مدرّب</p>

        <TrainerRequestReviewList initialRequests={requests || []} />
      </div>
    </>
  );
}
