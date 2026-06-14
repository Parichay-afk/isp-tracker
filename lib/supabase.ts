import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getNotes(taskGid: string) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("notes")
    .insert({ task_gid: taskGid, content, author })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChangelog(taskGid: string) {
  const { data, error } = await supabase
    .from("changelog")
    .select("*")
    .eq("task_gid", taskGid)
    .order("changed_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllChangelog() {
  const { data, error } = await supabase
    .from("changelog")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(200);

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
  const { error } = await supabase.from("changelog").insert({
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
