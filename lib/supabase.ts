import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization: only creates the client when first used at runtime
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  _client = createClient(url, key);
  return _client;
}

export async function getNotes(taskGid: string) {
  const { data, error } = await getClient()
    .from("notes")
    .select("*")
    .eq("task_gid", taskGid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addNote(
  taskGid: string,
  content: string,
  author = "Anonymous"
) {
  const { data, error } = await getClient()
    .from("notes")
    .insert({ task_gid: taskGid, content, author })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getChangelog(taskGid: string) {
  const { data, error } = await getClient()
    .from("changelog")
    .select("*")
    .eq("task_gid", taskGid)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function logChange(entry: {
  task_gid: string;
  task_name?: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by?: string;
  source?: "tracker" | "asana";
}) {
  const { error } = await getClient().from("changelog").insert({
    task_gid: entry.task_gid,
    task_name: entry.task_name || null,
    field_name: entry.field_name,
    old_value: entry.old_value || null,
    new_value: entry.new_value || null,
    changed_by: entry.changed_by || "Tracker",
    source: entry.source || "tracker",
  });
  if (error) console.error("Failed to log change:", error);
}
