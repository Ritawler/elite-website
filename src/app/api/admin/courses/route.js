import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  // Verify caller is an admin using their session.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, price, trainer_id, is_published } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "اسم الدورة مطلوب" }, { status: 400 });
  }

  // Use service-role client to bypass RLS for the insert.
  const adminClient = createAdminClient();
  const { data: course, error } = await adminClient
    .from("courses")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      price: Number(price) || 0,
      trainer_id: trainer_id || null,
      is_published: Boolean(is_published),
    })
    .select("id, title, description, price, discount_price, is_published, trainer_signature_url, trainer:users(full_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ course });
}
