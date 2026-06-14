import { NextRequest, NextResponse } from "next/server";
import {
  findProjectGid,
  createAsanaWebhook,
  listAsanaWebhooks,
  getWorkspaceGid,
} from "@/lib/asana";

const PROJECT_NAME =
  process.env.ASANA_PROJECT_NAME || "Star International Al Twar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const host =
      request.headers.get("host") ||
      process.env.VERCEL_URL ||
      "isp.praxisadvertising.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/webhook`;

    const projectGid = await findProjectGid(PROJECT_NAME);
    const workspaceGid = await getWorkspaceGid();

    // Check if webhook already exists
    const existing = await listAsanaWebhooks(workspaceGid);
    const alreadyExists = existing.some(
      (w: { target: string; resource: { gid: string } }) =>
        w.target === webhookUrl && w.resource?.gid === projectGid
    );

    if (alreadyExists) {
      return NextResponse.json({
        success: true,
        message: "Webhook already registered",
        webhookUrl,
        projectGid,
      });
    }

    const webhookGid = await createAsanaWebhook(projectGid, webhookUrl);

    return NextResponse.json({
      success: true,
      message: "Webhook registered successfully",
      webhookGid,
      webhookUrl,
      projectGid,
    });
  } catch (error) {
    console.error("Webhook setup failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
