# Development screenshots

Use `pnpm nocobase screenshot` from the application root for UI evidence. It starts a loopback-only development application on free ports with its own SQLite database, storage and Vite cache. It signs in as a temporary administrator and removes the instance when the command exits. It runs directly from source with its temporary configuration.

```bash
pnpm exec playwright install chromium
pnpm nocobase screenshot / /config --widths 1440,390 --locales en-US,zh-CN --themes light,dark
```

Default and Examples already declare `@playwright/test`. For an application without it, add `playwright` as a dev dependency with `pnpm add -D playwright`. If the screenshot command reports that Chromium could not launch, run `pnpm exec playwright install chromium` from the application root and retry the screenshot command. Capture checks Chromium before starting the development server. Starting an isolated instance requires macOS or Linux and a SQLite driver in the application. On Windows, use `--url` with an authorized test application.

Paths are relative to the application mount point. The command reads `APP_BASE_PATH` and prints the actual `Local:` address. It saves PNGs and a diagnostic log under `output/screenshots/` by default. Use `--out <dir>` for a separate output directory, `--sample-data` to load optional sample data, `--guest` for signed-out pages, `--full-page` for the entire scrollable page, and `--wait-for 'text=Dashboard'` or a Playwright selector to wait for a visible result. An uncaught page error fails the command and attempts to save a diagnostic PNG alongside the log.

## Reuse a warm instance

Run the first command in its own terminal, then copy the printed `Local:` URL and `Session:` path into the second command. Client edits are picked up by Vite. For server or configuration changes, stop and restart the instance.

```bash
pnpm nocobase screenshot --serve --sample-data
pnpm nocobase screenshot / --url '<Local URL>' --session '<Session path>'
```

Run the second command again after editing the UI. Press Ctrl+C in the first terminal when finished. Its private session file and temporary database are removed together. The session file contains the temporary administrator credentials. Keep it local. Never use global `pkill` or `killall`, or take over another application's development ports.

For an existing authorized test instance, pass its exact application entry URL and use `--guest` or `--email` with the test account's password in `NOCOBASE_SCREENSHOT_PASSWORD`. The CLI also accepts `--password`. Use separate test accounts for parallel runs because `i18n.locale` and `theme.mode` are account preferences. With `--url`, the command restores the previous values and removes any of these preferences that it added temporarily.

## Prepare data and interact with the page

Pass `--setup <file.mjs>` to run a default-exported function once after sign-in, before the capture matrix, for data or session preparation. Pass `--script <file.mjs>` to run a default-exported function after opening each target page and before capturing it. Use a trusted local module. Both hooks receive `{ page, context, baseURL, api, signal }`. Setup starts with a blank page. The `api(path, options)` function sends paths relative to `<baseURL>/api/` with the same authentication cookies as the browser, returning a Playwright `APIResponse`. Pass app-required request headers through `options.headers`, such as `Idempotency-Key` for standard writes.

```js
export default async function showDialog({ page }) {
  await page.getByRole('button', { name: 'New item' }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible' });
}
```

An application that needs different startup behavior can declare `nocobase.screenshot.env` in `package.json` as a map of non-secret environment strings for the isolated instance. For additional readiness, set `nocobase.screenshot.readyPath` to an application-relative HTTP path that returns a 2xx response when the application is ready. Existing CLI `beforeDev` hooks still run. Ordinary application environment and configuration are excluded from the isolated server, apart from the mount path. App-specific services should use isolated data and avoid external effects in screenshot mode.
