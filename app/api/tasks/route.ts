import { NextRequest, NextResponse } from "next/server";
import { findProjectGid, getProjectTasks, parseTaskStatus } from "@/lib/asana";
import { TrackerTask } from "@/types";

const DEFAULT_PROJECT = process.env.ASANA_PROJECT_NAME || "Star International Al Twar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get("project") || DEFAULT_PROJECT;

    const projectGid = await findProjectGid(projectName);
    const rawTasks = await getProjectTasks(projectGid);

    const tasks: TrackerTask[] = rawTasks.map((task) => {
      const { status, enumGid } = parseTaskStatus(task);
      return {
        gid: task.gid,
        name: task.name,
        status,
        due_on: task.due_on,
        responsible: task.assignee ? "Praxis" : "ISP",
        asana_assignee_gid: task.assignee?.gid || null,
        asana_status_enum_gid: enumGid,
      };
    });

    return NextResponse.json({ tasks, projectGid, projectName });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
