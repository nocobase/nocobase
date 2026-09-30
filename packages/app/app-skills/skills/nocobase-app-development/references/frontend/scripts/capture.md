# Screenshot tool

`capture.mjs` uses Playwright to open pages, perform actions and take screenshots according to a configuration, and writes console errors, page exceptions and 4xx/5xx requests to `screenshots/capture-log.json`. The full workflow uses it in its acceptance review (step 4 of [`../ui-workflow.md`](../ui-workflow.md)). It imports `@playwright/test` from the application's own `node_modules`, which the Default and Examples templates install and the Hub template does not: in a Hub application run `pnpm add -D @playwright/test` first, the devDependency [`../references/testing.md`](../references/testing.md) names for end-to-end tests. Run it from the application root:

```bash
# 1. Save the sign-in session: a browser window opens, the user signs in themselves, and the script never touches the password
node .agents/skills/nocobase-app-development/references/frontend/scripts/capture.mjs login --base http://127.0.0.1:13000/main/
```

```bash
# 2. Take screenshots from the configuration
node .agents/skills/nocobase-app-development/references/frontend/scripts/capture.mjs shoot --spec storage/ui-workflow/<feature>/capture.json
```

The sign-in session is saved to `storage/ui-workflow/auth.json` (`storage/` is ignored by git). Do not commit or share it, and delete it when the task ends. For `--base`, pass the `Local:` URL `pnpm dev` prints (for example `http://127.0.0.1:13000/main/`, trailing slash allowed); shot paths start with `/` after it; the `base` used for screenshots must be on the same host as the one used to sign in (sign-in sessions for `localhost` and `127.0.0.1` are not interchangeable). `login` waits 10 minutes by default; extend it with `--timeout <minutes>`. To keep a second session, such as a test account without some permission, pass `--state <file>` to `login`, and the same `--state` (or `"state"` in the configuration) to `shoot`.

## Configuration

```json
{
  "base": "http://127.0.0.1:13000/main",
  "out": "storage/ui-workflow/projects/screenshots",
  "locale": "zh-CN",
  "shots": [
    { "name": "list", "path": "/projects" },
    { "name": "dark", "path": "/projects", "colorScheme": "dark" },
    { "name": "spacious", "path": "/projects", "theme": "default" },
    {
      "name": "mobile",
      "path": "/projects",
      "viewport": { "width": 375, "height": 812 }
    },
    {
      "name": "forbidden",
      "path": "/projects",
      "setup": [
        {
          "fulfill": {
            "url": "**/api/projects*",
            "status": 403,
            "json": { "error": "Forbidden" }
          }
        }
      ]
    },
    {
      "name": "search-ime",
      "path": "/projects",
      "steps": [
        {
          "ime": {
            "selector": "role=textbox[name='搜索项目']",
            "compose": ["x", "xi", "xiang"],
            "commit": "项"
          }
        },
        { "wait": 600 }
      ]
    },
    {
      "name": "create-dialog-errors",
      "path": "/projects",
      "steps": [
        { "click": "role=button[name='新建项目']" },
        { "click": "role=button[name='创建']" }
      ]
    }
  ]
}
```

At the top level, the configuration can set `base`, `out`, `locale`, `viewport`, `colorScheme`, `theme` and `hide` (elements hidden in screenshots; by default the development toolbar `#agent-annotations-root` is hidden). Each shot can set:

| Field                            | Description                                                                                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                           | Path within the application, for example `/projects?status=active`                                                                                                                                             |
| `setup`                          | Steps run before the page opens; suited to `delay`, `block` and `fulfill`                                                                                                                                      |
| `steps`                          | Steps run after the page opens                                                                                                                                                                                 |
| `waitUntil`                      | What to wait for when opening the page; defaults to `networkidle`                                                                                                                                              |
| `colorScheme`, `theme`           | `light`, `dark` or `system`, and a preset id such as `compact` or `default`. Saved as the visitor's own appearance choice, so they win over `client.app.defaultColorScheme` and `defaultTheme` in `config.yml` |
| `viewport`, `locale`, `fullPage` | Viewport, language, whether to capture the full page                                                                                                                                                           |
| `settle`                         | Milliseconds to wait before the final screenshot; defaults to 500                                                                                                                                              |
| `screenshot`                     | When `false`, no screenshot is taken at the end (only mid-flow screenshots are used)                                                                                                                           |

## Steps

| Step                     | Effect                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `click`, `fill`, `press` | Click, fill in (`[selector, value]`), press a key                                                                                                                                                                                   |
| `type`                   | Type one key at a time: `["role=textbox[name='搜索项目']", "abc"]`, or `{ "text": "x" }` to type into the focused element after a `press` such as `ArrowLeft` has moved the caret                                                   |
| `ime`                    | Chinese IME input: `{ "selector": "…", "compose": ["z", "zh", "zhong"], "commit": "中" }` fires composition events with `isComposing` set for each `compose` entry, then commits the chosen characters, as a real input method does |
| `waitFor`, `wait`        | Wait for an element to appear; wait a fixed number of milliseconds                                                                                                                                                                  |
| `goto`                   | Go to another path within the application in the same shot                                                                                                                                                                          |
| `offline`                | `true` goes offline, `false` comes back online. Offline also cuts Vite's hot update connection, and the page reloads fully when the network comes back                                                                              |
| `block`                  | Make matching requests fail at the network level, for example `**/api/projects*`: the "request failed" state with "Retry"                                                                                                           |
| `fulfill`                | `{ "url": "…", "status": 403, "json": { … } }`: answer matching requests with that status and body. Use it for 403 (no "Retry"), 404 (record deleted), 409 with a business `code`, and 500                                          |
| `unblock`                | Remove the `block`, `fulfill` or `delay` registered for that URL pattern                                                                                                                                                            |
| `delay`                  | `{ "url": "...", "ms": 3000 }`: delay responses to matching requests                                                                                                                                                                |
| `screenshot`             | Take a screenshot mid-flow; the value is the file name                                                                                                                                                                              |

- To capture the loading state: use `setup` to delay only the page's own data endpoint, and set `waitUntil` to `domcontentloaded`. Do not delay, block or fulfill `**/api/**`: the application shell also waits on the session endpoint, and you would capture a blank page.
- URL patterns are Playwright globs matched against the full URL. `*` does not cross `/` and `?` is a literal character, so `**/api/projects*` matches the list request with or without a query string but not `/api/projects/12`, and `**/api/projects/*` matches a single record.
- `--only list,dark` runs only the named shots; earlier entries of the other shots stay in `capture-log.json`.
- If Playwright's bundled browser is not installed, the script uses the local Chrome instead.

Screenshots do not replace hands-on testing: you still walk through every interaction flow, and write Playwright assertions for what a screenshot cannot show (where focus goes, whether a button is disabled, how many requests were sent).
