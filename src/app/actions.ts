"use server";

import { MAX_PACKAGES, parseManifest, type Ecosystem } from "@/lib/manifest";
import { checkPackages, type PackageResult } from "@/lib/presend";

export type CheckState = { input: string } & (
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; ecosystem: Ecosystem; checked: number; total: number; results: PackageResult[] }
);

export async function checkManifest(_prev: CheckState, form: FormData): Promise<CheckState> {
  const input = String(form.get("manifest") ?? "");
  const manifest = parseManifest(input);
  if (!manifest.ok) return { input, status: "error", message: manifest.error };
  if (manifest.names.length === 0) return { input, status: "error", message: "No dependencies found." };
  const names = manifest.names.slice(0, MAX_PACKAGES);
  const results = await checkPackages(manifest.ecosystem, names);
  return { input, status: "done", ecosystem: manifest.ecosystem, checked: names.length, total: manifest.names.length, results };
}
