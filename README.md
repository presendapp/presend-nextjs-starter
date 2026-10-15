# Dependency check: a Next.js starter

A small Next.js app that checks a `package.json` or a `requirements.txt` before you install anything: names that do not exist on the registry, look-alikes of popular packages, packages first published less than 30 days ago, deprecated packages, and recent publisher changes on npm. It uses the free [Presend API](https://presend.pages.dev/api); only package names are sent.

It is also an example of how we think a starter should be kept: current versions, tests, CI, and a weekly run so that it does not quietly fall behind.

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000
```

Requires Node.js 22 or later (CI uses the version in `.nvmrc`). No API key is needed. To point at another Presend deployment, set `PRESEND_API_URL`.

## Deploy

Any Node.js host that runs Next.js works (`npm run build && npm start`). The check runs in a Server Action, so the API is called from your server, not from the visitor's browser.

## Project layout

| Path | What it is |
|---|---|
| `src/lib/manifest.ts` | Reads dependency names from a package.json or requirements.txt (pure, tested) |
| `src/lib/presend.ts` | Small client for the Presend API, batched and with timeouts (tested with a fake fetch) |
| `src/app/actions.ts` | Server Action called by the form |
| `src/app/check-form.tsx` | The form and the results table |

## Keeping it current

- **CI** (`.github/workflows/ci.yml`) runs lint, type check, tests, build and `npm audit` on every change and **every Monday**, so a newly published advisory fails the build even when nobody touched the code.
- **Dependabot** (`.github/dependabot.yml`) opens grouped weekly updates: Next.js and React together, development tooling together.
- The lockfile is committed on purpose: a fresh clone installs exactly what CI tested. That is also why it has to be kept up to date.

## Limits

These checks are signals worth a look, not a malware scan, and they do not cover known vulnerabilities of the versions you use (`npm audit` in CI does). The public API has per-minute rate limits; up to 100 dependencies are checked per request.

## License

MIT
