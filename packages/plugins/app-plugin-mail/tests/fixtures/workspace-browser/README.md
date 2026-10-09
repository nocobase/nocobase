# Isolated production workspace browser tests

Run the responsive workspace regression without accounts, application credentials or a mail server:

```bash
pnpm --filter @nocobase/app-plugin-mail exec playwright test \
  --config tests/playwright/workspace-browser.config.ts
```

The dedicated configuration builds the actual public workspace with installed application-template Vite/Tailwind tooling, starts a loopback static server, and stops it after the run. Playwright intercepts every API and WebSocket request with deterministic fixture data. No dependency installation, source aliases, external proxy or real mailbox access is required. The fixture route metadata does not implement the host application's authentication or authorization, and its synthetic permission cookie proves only fixture isolation.

Use an installed Playwright Chromium, or set `MAIL_WORKSPACE_BROWSER_EXECUTABLE` to an existing Chrome executable. `MAIL_WORKSPACE_BROWSER_PORT` overrides the default loopback port. `MAIL_WORKSPACE_BROWSER_URL` can point to an already running copy of this same fixture and disables managed build/server startup; do not point it at a real application. The live-mail acceptance configuration skips this suite unless the dedicated configuration's metadata is present.

Results, deterministic request logs, measured geometry and bounded CDP screenshots are attached to `.tmp/mail-issue7-browser/results.json` at the repository root. Build and runner artifacts stay in that ignored directory. Add `--repeat-each=2` for a repeated stability check.
