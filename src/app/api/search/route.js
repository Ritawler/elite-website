import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const [{ data: courses }, { data: topics }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_topics")
      .select("id, title, author_name")
      .order("published_at", { ascending: false }),
  ]);

  return NextResponse.json({
    courses: courses || [],
    topics: topics || [],
  });
}
