import { NextRequest, NextResponse } from "next/server";
import { getChangelog } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { gid: string } }
) {
  try {
    const changelog = await getChangelog(params.gid);
    return NextResponse.json({ changelog });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
