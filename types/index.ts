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
  Ready: "bg-green-100 text-green-800 border-green-200",
  Design: "bg-blue-100 text-blue-800 border-blue-200",
  Research: "bg-purple-100 text-purple-800 border-purple-200",
  "Pending Approval": "bg-orange-100 text-orange-800 border-orange-200",
  Installed: "bg-teal-100 text-teal-800 border-teal-200",
  "Pending Content": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Vendors Needed": "bg-red-100 text-red-800 border-red-200",
  "Production and Installation": "bg-indigo-100 text-indigo-800 border-indigo-200",
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
