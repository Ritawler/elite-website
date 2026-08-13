import { redirect } from "next/navigation";

// Role selection is no longer used — all new accounts are automatically
// assigned the student role. Redirect anyone who lands here.
export default function SelectRolePage() {
  redirect("/dashboard");
}
