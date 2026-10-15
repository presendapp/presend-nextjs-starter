"use client";

import { useActionState } from "react";
import { checkManifest, type CheckState } from "./actions";

const EXAMPLE = `{
  "dependencies": {
    "expres": "^4.18.0",
    "lodash": "^4.17.21"
  }
}`;

export function CheckForm() {
  const [state, action, pending] = useActionState<CheckState, FormData>(checkManifest, { input: "", status: "idle" });
  const flagged = state.status === "done" ? state.results.filter((r) => r.findings.length || r.unchecked.length) : [];

  return (
    <>
      <form action={action}>
        <label htmlFor="manifest">package.json or requirements.txt</label>
        <textarea id="manifest" name="manifest" rows={12} spellCheck={false} placeholder={EXAMPLE} defaultValue={state.input} required />
        {/* React resets the form after a Server Action; defaultValue brings back what was submitted. */}
        <button type="submit" disabled={pending}>{pending ? "Checking…" : "Check"}</button>
      </form>

      <section aria-live="polite">
        {state.status === "error" && <p className="error">{state.message}</p>}
        {state.status === "done" && (
          <>
            <p>
              {state.checked} {state.ecosystem === "npm" ? "npm" : "PyPI"} package(s) checked
              {state.total > state.checked ? ` (first ${state.checked} of ${state.total})` : ""}:{" "}
              {flagged.length === 0 ? "no signal from these checks." : `${flagged.length} to look at.`}
            </p>
            {flagged.length > 0 && (
              <table>
                <thead>
                  <tr><th>Package</th><th>Result</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {flagged.flatMap((r) => [
                    ...r.findings.map((f, i) => (
                      <tr key={`${r.name}-f${i}`}>
                        <td>{r.name}</td>
                        <td><span className={`tag ${f.level}`}>{f.title}</span></td>
                        <td>{f.detail}</td>
                      </tr>
                    )),
                    ...(r.unchecked.length
                      ? [
                          <tr key={`${r.name}-u`}>
                            <td>{r.name}</td>
                            <td><span className="tag">Not checked</span></td>
                            <td>{r.unchecked.join(", ")}</td>
                          </tr>,
                        ]
                      : []),
                  ])}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>
    </>
  );
}
