// Minimal client for the free Presend API (https://presend.pages.dev/api).
// Only package names are sent. Per-minute rate limits apply on the public API.

import type { Ecosystem } from "./manifest";

export const PRESEND_API_URL = process.env.PRESEND_API_URL ?? "https://presend.pages.dev";
const TIMEOUT_MS = 15_000;

export type Finding = { level: "issue" | "warning"; title: string; detail: string };
export type PackageResult = { name: string; findings: Finding[]; unchecked: string[] };

type RegistryResult = {
  error?: string;
  found?: boolean;
  suspicious?: boolean | null;
  new_package?: boolean | null;
  first_published?: string | null;
  package_age_days?: number | null;
  latest_deprecated?: boolean | null;
  latest_deprecation_message?: string | null;
};
type TyposquatResult = { error?: string; suspicious?: boolean; similar_to?: { name: string }[] };

async function post<T>(endpoint: string, ecosystem: Ecosystem, packages: string[], fetchImpl: typeof fetch): Promise<T[]> {
  const res = await fetchImpl(`${PRESEND_API_URL}/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "presend-nextjs-starter" },
    body: JSON.stringify({ ecosystem, packages }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429) throw new Error("rate limited, try again in a minute");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { results?: T[] };
  if (!Array.isArray(data.results) || data.results.length !== packages.length) throw new Error("unexpected response");
  return data.results;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function checkPackages(ecosystem: Ecosystem, names: string[], fetchImpl: typeof fetch = fetch): Promise<PackageResult[]> {
  const results = new Map<string, PackageResult>(names.map((n) => [n, { name: n, findings: [], unchecked: [] }]));
  const registry = ecosystem === "npm" ? "npm" : "PyPI";

  // Existence, age, deprecation and publisher changes: 20 names per request.
  for (const group of chunks(names, 20)) {
    try {
      const rows = await post<RegistryResult>("maintainer-change-check", ecosystem, group, fetchImpl);
      rows.forEach((r, i) => {
        const res = results.get(group[i])!;
        if (r.error) return void res.unchecked.push("registry");
        if (r.found === false) {
          res.findings.push({ level: "issue", title: `Does not exist on ${registry}`, detail: "The name may be a typo or invented; anyone could register it." });
          return;
        }
        if (r.suspicious) res.findings.push({ level: "issue", title: "Publisher change", detail: "A new publisher took over after a long period of inactivity." });
        if (r.latest_deprecated) res.findings.push({ level: "warning", title: "Deprecated", detail: r.latest_deprecation_message ?? "The latest version is deprecated." });
        if (r.new_package) res.findings.push({ level: "warning", title: "New package", detail: `First published ${String(r.first_published).slice(0, 10)} (${r.package_age_days} days ago).` });
      });
    } catch (e) {
      group.forEach((n) => results.get(n)!.unchecked.push(`registry (${(e as Error).message})`));
    }
  }

  // Look-alikes of popular packages: up to 100 names per request.
  for (const group of chunks(names, 100)) {
    try {
      const rows = await post<TyposquatResult>("typosquat-check", ecosystem, group, fetchImpl);
      rows.forEach((r, i) => {
        const res = results.get(group[i])!;
        if (r.error) res.unchecked.push("look-alike");
        else if (r.suspicious) res.findings.push({ level: "warning", title: "Close to a popular package", detail: `Close to ${(r.similar_to ?? []).map((s) => s.name).join(", ")}.` });
      });
    } catch (e) {
      group.forEach((n) => results.get(n)!.unchecked.push(`look-alike (${(e as Error).message})`));
    }
  }

  return [...results.values()];
}
