import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderHtmlToPdf } from "@/lib/pdf";

export const maxDuration = 30;

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { html } = await request.json();
  if (typeof html !== "string") {
    return NextResponse.json({ error: "html required" }, { status: 400 });
  }

  try {
    const pdfBuffer = await renderHtmlToPdf(html);
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="note.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "pdf generation failed" }, { status: 500 });
  }
}
