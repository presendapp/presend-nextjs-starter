import { describe, expect, it } from "vitest";
import { parseManifest } from "./manifest";

describe("parseManifest", () => {
  it("reads npm dependencies from all sections, without duplicates", () => {
    const r = parseManifest(JSON.stringify({ dependencies: { next: "16", react: "19" }, devDependencies: { react: "19", vitest: "4" } }));
    expect(r).toEqual({ ok: true, ecosystem: "npm", names: ["next", "react", "vitest"] });
  });

  it("reports invalid JSON", () => {
    const r = parseManifest("{ not json");
    expect(r.ok).toBe(false);
  });

  it("reads requirements.txt, skipping comments, options, URLs and paths", () => {
    const r = parseManifest(["requests==2.32.4  # http", "-r other.txt", "Django>=5.2", "git+https://x/y", "./local", "django-ninja", "Requests"].join("\n"));
    expect(r).toEqual({ ok: true, ecosystem: "pypi", names: ["requests", "Django", "django-ninja"] });
  });

  it("rejects empty input", () => {
    expect(parseManifest("   ").ok).toBe(false);
  });
});
