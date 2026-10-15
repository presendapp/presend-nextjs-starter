import { describe, expect, it, vi } from "vitest";
import { checkPackages } from "./presend";

function fakeFetch(responses: Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const key = Object.keys(responses).find((k) => String(url).endsWith(k))!;
    const body = responses[key];
    if (typeof body === "number") return new Response("", { status: body });
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
}

describe("checkPackages", () => {
  it("maps registry and look-alike signals to findings", async () => {
    const f = fakeFetch({
      "/api/maintainer-change-check": { results: [{ found: false }, { found: true, latest_deprecated: true, latest_deprecation_message: "use x" }] },
      "/api/typosquat-check": { results: [{ suspicious: true, similar_to: [{ name: "express" }] }, { suspicious: false }] },
    });
    const r = await checkPackages("npm", ["expres", "old-lib"], f);
    expect(r[0].findings.map((x) => x.title)).toEqual(["Does not exist on npm", "Close to a popular package"]);
    expect(r[1].findings).toEqual([{ level: "warning", title: "Deprecated", detail: "use x" }]);
  });

  it("marks packages as not checked when the API is rate limited", async () => {
    const f = fakeFetch({ "/api/maintainer-change-check": 429, "/api/typosquat-check": 429 });
    const r = await checkPackages("pypi", ["requests"], f);
    expect(r[0].findings).toEqual([]);
    expect(r[0].unchecked).toEqual(["registry (rate limited, try again in a minute)", "look-alike (rate limited, try again in a minute)"]);
  });
});
