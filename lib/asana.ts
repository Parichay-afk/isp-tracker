import { AsanaTask, AsanaCustomField, STATUS_OPTIONS, StatusOption } from "@/types";

const ASANA_BASE = "https://app.asana.com/api/1.0";
const PAT = process.env.ASANA_PAT!;

const headers = () => ({
  Authorization: `Bearer ${PAT}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// In-memory cache for the session
let cachedProjectGid: string | null = null;
let cachedStatusFieldGid: string | null = null;
let cachedEnumOptions: Record<string, string> | null = null; // name -> gid

async function asanaFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${ASANA_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers || {}) },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asana API error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function getWorkspaceGid(): Promise<string> {
  const data = await asanaFetch("/workspaces?opt_fields=gid,name&limit=10");
  if (!data.data?.length) throw new Error("No Asana workspaces found");
  return data.data[0].gid;
}

export async function findProjectGid(projectName: string): Promise<string> {
  if (cachedProjectGid) return cachedProjectGid;

  const workspaceGid = await getWorkspaceGid();
  const encoded = encodeURIComponent(projectName);
  const data = await asanaFetch(
    `/projects?workspace=${workspaceGid}&opt_fields=gid,name&archived=false&limit=100`
  );

  const project = data.data?.find(
    (p: { gid: string; name: string }) =>
      p.name.toLowerCase() === projectName.toLowerCase()
  );

  if (!project) {
    throw new Error(`Project "${projectName}" not found in Asana`);
  }

  cachedProjectGid = project.gid;
  return project.gid;
}

export async function getStatusFieldInfo(projectGid: string): Promise<{
  fieldGid: string;
  enumOptions: Record<string, string>;
}> {
  if (cachedStatusFieldGid && cachedEnumOptions) {
    return { fieldGid: cachedStatusFieldGid, enumOptions: cachedEnumOptions };
  }

  // Get project's custom field settings
  const data = await asanaFetch(
    `/projects/${projectGid}/custom_field_settings?opt_fields=custom_field.gid,custom_field.name,custom_field.type,custom_field.enum_options`
  );

  let bestField: AsanaCustomField | null = null;

  for (const setting of data.data || []) {
    const field = setting.custom_field;
    if (field?.type !== "enum") continue;

    // Check if this field has options that match our status list
    const optionNames = (field.enum_options || [])
      .filter((o: { enabled: boolean }) => o.enabled)
      .map((o: { name: string }) => o.name);

    const matchCount = STATUS_OPTIONS.filter((s) =>
      optionNames.some(
        (n: string) => n.toLowerCase() === s.toLowerCase()
      )
    ).length;

    // If it matches at least 3 of our statuses, it's likely the right field
    if (matchCount >= 3) {
      bestField = field;
      break;
    }

    // Also match by field name containing "status"
    if (field.name?.toLowerCase().includes("status") && !bestField) {
      bestField = field;
    }
  }

  if (!bestField) {
    throw new Error("Could not find status custom field in Asana project");
  }

  const enumOptions: Record<string, string> = {};
  for (const opt of bestField.enum_options || []) {
    if (opt.enabled) {
      enumOptions[opt.name] = opt.gid;
    }
  }

  cachedStatusFieldGid = bestField.gid;
  cachedEnumOptions = enumOptions;

  return { fieldGid: bestField.gid, enumOptions };
}

export async function getProjectTasks(projectGid: string): Promise<AsanaTask[]> {
  const fields = [
    "gid",
    "name",
    "due_on",
    "assignee.gid",
    "assignee.name",
    "custom_fields.gid",
    "custom_fields.name",
    "custom_fields.type",
    "custom_fields.enum_value.gid",
    "custom_fields.enum_value.name",
    "custom_fields.enum_options.gid",
    "custom_fields.enum_options.name",
    "custom_fields.enum_options.enabled",
    "completed",
  ].join(",");

  const data = await asanaFetch(
    `/projects/${projectGid}/tasks?opt_fields=${fields}&limit=100`
  );

  // Filter out completed tasks
  return (data.data || []).filter((t: AsanaTask & { completed: boolean }) => !t.completed);
}

export async function updateAsanaTask(
  taskGid: string,
  updates: {
    name?: string;
    due_on?: string | null;
    assignee?: string | null; // gid or null
    statusEnumGid?: string | null; // enum option gid
    statusFieldGid?: string;
  }
): Promise<void> {
  const body: Record<string, unknown> = {};

  if (updates.name !== undefined) body.name = updates.name;
  if (updates.due_on !== undefined) body.due_on = updates.due_on;
  if (updates.assignee !== undefined) body.assignee = updates.assignee;

  if (updates.statusEnumGid !== undefined && updates.statusFieldGid) {
    body.custom_fields = {
      [updates.statusFieldGid]: updates.statusEnumGid,
    };
  }

  await asanaFetch(`/tasks/${taskGid}`, {
    method: "PUT",
    body: JSON.stringify({ data: body }),
  });
}

export async function createAsanaWebhook(
  projectGid: string,
  targetUrl: string
): Promise<string> {
  const data = await asanaFetch("/webhooks", {
    method: "POST",
    body: JSON.stringify({
      data: {
        resource: projectGid,
        target: targetUrl,
        filters: [
          {
            resource_type: "task",
            action: "changed",
            fields: ["name", "due_on", "assignee", "custom_fields", "completed"],
          },
          { resource_type: "task", action: "added" },
          { resource_type: "task", action: "removed" },
          { resource_type: "task", action: "deleted" },
        ],
      },
    }),
  });

  return data.data?.gid;
}

export async function listAsanaWebhooks(workspaceGid: string) {
  const data = await asanaFetch(
    `/webhooks?workspace=${workspaceGid}&opt_fields=gid,target,resource.gid`
  );
  return data.data || [];
}

export function parseTaskStatus(
  task: AsanaTask
): { status: StatusOption | null; enumGid: string | null } {
  for (const field of task.custom_fields || []) {
    if (field.type === "enum" && field.enum_value) {
      const statusName = field.enum_value.name as StatusOption;
      if (STATUS_OPTIONS.includes(statusName)) {
        return { status: statusName, enumGid: field.enum_value.gid };
      }
    }
  }
  return { status: null, enumGid: null };
}

export function parseTaskStatusField(task: AsanaTask): string | null {
  for (const field of task.custom_fields || []) {
    if (field.type === "enum") {
      const optionNames = (field.enum_options || []).map(
        (o: { name: string }) => o.name
      );
      const matchCount = STATUS_OPTIONS.filter((s) =>
        optionNames.some((n: string) => n.toLowerCase() === s.toLowerCase())
      ).length;
      if (matchCount >= 2) return field.gid;
    }
  }
  return null;
}
