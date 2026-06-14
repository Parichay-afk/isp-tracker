import { NextRequest, NextResponse } from "next/server";
import { logChange } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Asana sends a handshake on webhook creation - we must echo the X-Hook-Secret
export async function POST(request: NextRequest) {
  const hookSecret = request.headers.get("X-Hook-Secret");

  // Handshake: echo the secret back
  if (hookSecret) {
    return new NextResponse(null, {
      status: 200,
      headers: { "X-Hook-Secret": hookSecret },
    });
  }

  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      // Only process task events
      if (event.type !== "task") continue;

      const taskGid = event.resource?.gid;
      if (!taskGid) continue;

      const action = event.action;
      const change = event.change;

      if (action === "added") {
        await logChange({
          task_gid: taskGid,
          task_name: event.resource?.name || null,
          field_name: "task",
          old_value: undefined,
          new_value: "Task created",
          changed_by: event.user?.name || "Asana",
          source: "asana",
        });
      } else if (action === "removed" || action === "deleted") {
        await logChange({
          task_gid: taskGid,
          task_name: undefined,
          field_name: "task",
          old_value: "Active",
          new_value: "Deleted",
          changed_by: event.user?.name || "Asana",
          source: "asana",
        });
      } else if (action === "changed" && change) {
        // Map Asana field names to friendly names
        const fieldMap: Record<string, string> = {
          name: "name",
          due_on: "due_on",
          assignee: "responsible",
          custom_fields: "status",
          completed: "completed",
        };

        const fieldName = fieldMap[change.field] || change.field;

        let oldValue = null;
        let newValue = null;

        if (change.field === "assignee") {
          oldValue = change.old_value ? "Praxis" : "ISP";
          newValue = change.new_value ? "Praxis" : "ISP";
        } else if (change.field === "custom_fields") {
          // For custom field changes, the value is the enum name
          oldValue = change.old_value?.name || change.old_value || null;
          newValue = change.new_value?.name || change.new_value || null;
        } else {
          oldValue = change.old_value ?? null;
          newValue = change.new_value ?? null;
        }

        await logChange({
          task_gid: taskGid,
          task_name: undefined,
          field_name: fieldName,
          old_value: String(oldValue ?? ""),
          new_value: String(newValue ?? ""),
          changed_by: event.user?.name || "Asana",
          source: "asana",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
