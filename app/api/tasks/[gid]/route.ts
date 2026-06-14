import { NextRequest, NextResponse } from "next/server";
import {
  findProjectGid,
  getStatusFieldInfo,
  updateAsanaTask,
  getProjectTasks,
  parseTaskStatus,
} from "@/lib/asana";
import { logChange } from "@/lib/supabase";
import { StatusOption } from "@/types";

const PROJECT_NAME =
  process.env.ASANA_PROJECT_NAME || "Star International Al Twar";
const PRAXIS_DEFAULT_ASSIGNEE_GID =
  process.env.PRAXIS_DEFAULT_ASSIGNEE_GID || null;

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { gid: string } }
) {
  try {
    const taskGid = params.gid;
    const body = await request.json();
    const { field, value, oldValue, taskName } = body;

    const projectGid = await findProjectGid(PROJECT_NAME);

    // Get current task to capture old values
    const tasks = await getProjectTasks(projectGid);
    const currentTask = tasks.find((t) => t.gid === taskGid);
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: Parameters<typeof updateAsanaTask>[1] = {};
    let logOldValue = oldValue ?? null;
    let logNewValue = value ?? null;

    switch (field) {
      case "name": {
        updates.name = value;
        logOldValue = currentTask.name;
        logNewValue = value;
        break;
      }

      case "status": {
        const { fieldGid, enumOptions } = await getStatusFieldInfo(projectGid);
        const statusName = value as StatusOption;
        const enumGid = enumOptions[statusName] || null;

        updates.statusFieldGid = fieldGid;
        updates.statusEnumGid = enumGid;

        const { status: oldStatus } = parseTaskStatus(currentTask);
        logOldValue = oldStatus;
        logNewValue = statusName;
        break;
      }

      case "due_on": {
        updates.due_on = value || null;
        logOldValue = currentTask.due_on;
        logNewValue = value || null;
        break;
      }

      case "responsible": {
        if (value === "ISP") {
          updates.assignee = null;
        } else if (value === "Praxis") {
          // Only assign if we have a default, otherwise keep as-is
          if (PRAXIS_DEFAULT_ASSIGNEE_GID) {
            updates.assignee = PRAXIS_DEFAULT_ASSIGNEE_GID;
          } else if (!currentTask.assignee) {
            // No default configured - we'll update the UI but can't assign in Asana
            console.warn(
              "No PRAXIS_DEFAULT_ASSIGNEE_GID configured. Assignee unchanged in Asana."
            );
          }
        }
        logOldValue = currentTask.assignee ? "Praxis" : "ISP";
        logNewValue = value;
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown field" }, { status: 400 });
    }

    // Apply updates to Asana
    if (Object.keys(updates).length > 0) {
      await updateAsanaTask(taskGid, updates);
    }

    // Log the change to Supabase
    await logChange({
      task_gid: taskGid,
      task_name: taskName || currentTask.name,
      field_name: field,
      old_value: logOldValue,
      new_value: logNewValue,
      changed_by: "Tracker",
      source: "tracker",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
