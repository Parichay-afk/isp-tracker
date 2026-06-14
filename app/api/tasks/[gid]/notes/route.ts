import { NextRequest, NextResponse } from "next/server";
import { getNotes, addNote } from "@/lib/supabase";
import { sendNoteNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { gid: string } }
) {
  try {
    const notes = await getNotes(params.gid);
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { gid: string } }
) {
  try {
    const body = await request.json();
    const { content, author, taskName } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Note content cannot be empty" },
        { status: 400 }
      );
    }

    const note = await addNote(params.gid, content.trim(), author || "Anonymous");

    // Send email notification (non-blocking)
    sendNoteNotification(taskName || "Unknown wall", content.trim(), author || "Anonymous").catch(
      (err) => console.error("Email notification failed:", err)
    );

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
