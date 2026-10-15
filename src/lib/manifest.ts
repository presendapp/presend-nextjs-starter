// Reads the dependency names out of a package.json (npm) or a requirements.txt (PyPI).
// Pure function: no network, easy to test.

export type Ecosystem = "npm" | "pypi";

export type Manifest =
  | { ok: true; ecosystem: Ecosystem; names: string[] }
  | { ok: false; error: string };

export const MAX_PACKAGES = 100;

export function parseManifest(input: string): Manifest {
  const text = input.trim();
  if (!text) return { ok: false, error: "Paste a package.json or a requirements.txt first." };

  if (text.startsWith("{")) {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: `This looks like JSON but could not be parsed: ${(e as Error).message}` };
    }
    const names = new Set<string>();
    for (const key of ["dependencies", "devDependencies", "optionalDependencies"] as const) {
      const section = (json as Record<string, unknown>)?.[key];
      if (section && typeof section === "object") Object.keys(section).forEach((n) => names.add(n));
    }
    return { ok: true, ecosystem: "npm", names: [...names] };
  }

  // requirements.txt: one requirement per line; skip comments, options (-r, -e...), URLs and local paths.
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line || line.startsWith("-") || line.includes("://") || /^[./~]/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)/);
    if (!m) continue;
    const key = m[1].toLowerCase().replace(/[-_.]+/g, "-"); // PyPI name normalisation
    if (!seen.has(key)) {
      seen.add(key);
      names.push(m[1]);
    }
  }
  return { ok: true, ecosystem: "pypi", names };
}
