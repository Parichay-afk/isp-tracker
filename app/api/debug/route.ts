import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env vars (show presence, not values)
  results.env = {
    ASANA_PAT: process.env.ASANA_PAT ? `set (${process.env.ASANA_PAT.length} chars)` : "MISSING",
    ASANA_PROJECT_NAME: process.env.ASANA_PROJECT_NAME || "MISSING (will use default)",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING",
  };

  // 2. Try to reach Asana API
  const pat = process.env.ASANA_PAT;
  if (!pat) {
    results.asana = { error: "ASANA_PAT not set — cannot test connection" };
    return NextResponse.json(results);
  }

  try {
    // Test: get workspaces
    const wsRes = await fetch("https://app.asana.com/api/1.0/workspaces?opt_fields=gid,name", {
      headers: { Authorization: `Bearer ${pat}`, Accept: "application/json" },
    });

    if (!wsRes.ok) {
      const txt = await wsRes.text();
      results.asana = { error: `Workspace fetch failed: ${wsRes.status}`, body: txt.slice(0, 300) };
      return NextResponse.json(results);
    }

    const wsData = await wsRes.json();
    const workspaces = wsData.data || [];
    results.asana = { workspaces: workspaces.map((w: { gid: string; name: string }) => ({ gid: w.gid, name: w.name })) };

    if (!workspaces.length) {
      results.asana_projects = { error: "No workspaces found" };
      return NextResponse.json(results);
    }

    // Test: get projects in first workspace
    const wsGid = workspaces[0].gid;
    const projectName = process.env.ASANA_PROJECT_NAME || "Star International Al Twar";

    const projRes = await fetch(
      `https://app.asana.com/api/1.0/projects?workspace=${wsGid}&opt_fields=gid,name&archived=false&limit=100`,
      { headers: { Authorization: `Bearer ${pat}`, Accept: "application/json" } }
    );

    if (!projRes.ok) {
      const txt = await projRes.text();
      results.asana_projects = { error: `Projects fetch failed: ${projRes.status}`, body: txt.slice(0, 300) };
      return NextResponse.json(results);
    }

    const projData = await projRes.json();
    const allProjects = (projData.data || []).map((p: { gid: string; name: string }) => p.name);
    const matchedProject = (projData.data || []).find(
      (p: { gid: string; name: string }) => p.name.toLowerCase() === projectName.toLowerCase()
    );

    results.asana_projects = {
      searching_for: projectName,
      found: matchedProject ? `YES — GID: ${matchedProject.gid}` : "NO — not found",
      all_project_names: allProjects,
    };

    // If found, test task fetch
    if (matchedProject) {
      const taskRes = await fetch(
        `https://app.asana.com/api/1.0/projects/${matchedProject.gid}/tasks?opt_fields=gid,name,completed&limit=10`,
        { headers: { Authorization: `Bearer ${pat}`, Accept: "application/json" } }
      );
      const taskData = await taskRes.json();
      const tasks = taskData.data || [];
      results.asana_tasks = {
        total_returned: tasks.length,
        sample: tasks.slice(0, 3).map((t: { gid: string; name: string; completed: boolean }) => ({
          name: t.name,
          completed: t.completed,
        })),
      };
    }
  } catch (e) {
    results.asana = { error: `Exception: ${String(e)}` };
  }

  return NextResponse.json(results, { status: 200 });
}
