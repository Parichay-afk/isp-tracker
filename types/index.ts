export type StatusOption =
  | "Ready"
  | "Design"
  | "Research"
  | "Pending Approval"
  | "Installed"
  | "Pending Content"
  | "Vendors Needed"
  | "Production and Installation";

export const STATUS_OPTIONS: StatusOption[] = [
  "Ready",
  "Design",
  "Research",
  "Pending Approval",
  "Installed",
  "Pending Content",
  "Vendors Needed",
  "Production and Installation",
];

export const STATUS_COLORS: Record<StatusOption, string> = {
  Ready:                          "bg-green-500 text-white border-green-600",
  Design:                         "bg-blue-500 text-white border-blue-600",
  Research:                       "bg-violet-500 text-white border-violet-600",
  "Pending Approval":             "bg-orange-500 text-white border-orange-600",
  Installed:                      "bg-emerald-600 text-white border-emerald-700",
  "Pending Content":              "bg-amber-400 text-amber-900 border-amber-500",
  "Vendors Needed":               "bg-red-500 text-white border-red-600",
  "Production and Installation":  "bg-indigo-600 text-white border-indigo-700",
};

export interface TrackerTask {
  gid: string;
  name: string;
  status: StatusOption | null;
  due_on: string | null; // YYYY-MM-DD
  responsible: "Praxis" | "ISP";
  asana_assignee_gid: string | null;
  asana_status_enum_gid: string | null;
  notes?: Note[];
}

export interface Note {
  id: string;
  task_gid: string;
  content: string;
  created_at: string;
  author: string;
}

export interface ChangelogEntry {
  id: string;
  task_gid: string;
  task_name: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string;
  source: "tracker" | "asana";
}

export interface AsanaTask {
  gid: string;
  name: string;
  due_on: string | null;
  assignee: { gid: string; name: string } | null;
  custom_fields: AsanaCustomField[];
}

export interface AsanaCustomField {
  gid: string;
  name: string;
  type: string;
  enum_value: { gid: string; name: string } | null;
  enum_options?: { gid: string; name: string; enabled: boolean }[];
}
