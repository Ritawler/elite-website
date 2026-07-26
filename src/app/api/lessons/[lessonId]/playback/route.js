import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedEmbedUrl } from "@/lib/bunny";

export async function POST(request, { params }) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS on public.lessons already restricts this select to: an enrolled
  // student of the lesson's course, the course's own trainer, or an admin —
  // see supabase/lessons.sql. If the row comes back null, this user simply
  // isn't authorized to watch it, so there's no separate enrollment check
  // to duplicate here.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, bunny_video_id")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "غير مصرّح لك بمشاهدة هذا الدرس" }, { status: 403 });
  }

  return NextResponse.json({ embedUrl: getSignedEmbedUrl(lesson.bunny_video_id) });
}
