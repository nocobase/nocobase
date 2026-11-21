# Frontend workflow

The entry point for frontend work. Read it while planning a feature, before writing frontend or backend code, and before any change to `client/`. Pages, data, endpoint contracts and permissions are planned together; nothing waits for the user's approval unless a material business or scope question needs their decision.

There are exactly two workflows. Say in one sentence of your reply which one you follow:

- [Change an existing page](#change-an-existing-page): implement, verify at 1440 and 390, report.
- [New page or module](#new-page-or-module): page plan, start from the runnable example, implement, verify, independent acceptance, report.

Every page works on a phone by default; checking it at 390 px is part of every page change, following [the phone experience](mobile.md). Browser APIs follow [browser API compatibility](frontend-dev.md#browser-api-compatibility).

**Theme changes** (primary color, fonts, density, radius, shadows, presets) follow [`references/theme.md`](references/theme.md): change tokens or presets as its sections 3 and 4 describe, verify with its section 7, and report as a page change does. No page plan.

## Change an existing page

1. Read the documents the change touches, found through ["Look up by task"](frontend-dev.md#look-up-by-task), and the relevant parts of [`ui-guidelines.md`](ui-guidelines.md). When the change adds a component, follow the selection order in [`design-contract.md`](design-contract.md).
2. Implement in the style of the surrounding code and copy. New or changed behavior, and a reproducible bug, get a component test; copy-only or styling-only changes need none ([`references/testing.md`](references/testing.md)).
3. Run the [self-check](frontend-dev.md#self-check-before-finishing), including the component checker.
4. [Verify in the browser](#verify-in-the-browser) the changed element and the interactions it affects, at 1440 and 390. A bug fix reproduces the original steps.
5. [Report](#report).

If the change needs a new module or a redesigned journey, switch to the new-page workflow.

## New page or module

There is no shorter path for a new CRUD page: plan, start from the example, implement, accept.

**Required reading** for a new CRUD page: [`../../SKILL.md`](../../SKILL.md), this file, [`ui-guidelines.md`](ui-guidelines.md), [`design-contract.md`](design-contract.md), [`mobile.md`](mobile.md), [`references/page.md`](references/page.md), [`references/table.md`](references/table.md), [`references/form.md`](references/form.md), [`references/overlay.md`](references/overlay.md), [`references/api.md`](references/api.md) and [`references/executable-list-edit.md`](references/executable-list-edit.md).

Open these only when the page needs them: [`references/child-routes.md`](references/child-routes.md) (tabs, covering child pages, nested routes), [`references/data-changes.md`](references/data-changes.md) (refresh across views after a write), [`references/styling.md`](references/styling.md) (tokens, buttons, icons, charts), [`references/theme.md`](references/theme.md) (tokens and presets), [`references/i18n.md`](references/i18n.md) (copy keys, dates and numbers), [`references/testing.md`](references/testing.md) (the test harness) and [`references/ui-library.md`](references/ui-library.md) (registry components that are not installed yet).

### 1. Write the page plan

Write a page plan of 1–2 KB to `docs/ui/pages/<feature>.md` in the application (or the project's existing design-documentation location), and keep it: it records the decisions later changes must respect. It is a short list, not a form to fill in:

- **Users and tasks**: who uses the page and what they come to do; the scope asked for.
- **Route tree**: the page path, its child routes (`new`, `:id`, `:id/edit`, `:id/details`, tabs) and its menu entry and icon.
- **List, detail and form**: which page template from [`ui-guidelines.md`](ui-guidelines.md) each view uses, whether the detail is a drawer or a page, and that forms open in a `RouteDialog`.
- **Primary row actions**: the menu items, and at most two actions shown outside the menu, if any.
- **Data and scopes**: fields, endpoints (existing ones linked, new ones specified so the backend is built to them), permissions, and the `scopes` the views declare and the writes announce.
- **Components**: what each region reuses, in the order of [`design-contract.md`](design-contract.md) (existing business component, installed primitive, registry addition, justified custom composition), and any primitive to add.
- **Phone layout**: the first screen at 390 px, cards, where filters go, what moves into a menu or sheet.

Check the plan against the review checklist of [`ui-guidelines.md`](ui-guidelines.md) and the application's existing design decisions before coding; this is the design review. Mention the plan's path in your progress update and continue.

### 2. Start from the runnable example

Copy the tested list/detail/create/edit example as [`references/executable-list-edit.md`](references/executable-list-edit.md) describes (the Examples template's `client/pages/skill-projects/`) and adapt it to the plan. Its names, fields, columns, filters, copy keys and widths are placeholders; remove what the plan does not ask for.

### 3. Implement

Implement the plan, frontend and backend together (backend: [`../server-routes.md`](../server-routes.md), [`../migrations.md`](../migrations.md), [`../database-and-data.md`](../database-and-data.md)). Cover the page's key behavior with component tests in `tests/client/` and add a new App page to the route test ([`references/page.md`](references/page.md)). Run the [self-check](frontend-dev.md#self-check-before-finishing), including the component checker, before verifying.

### 4. Verify, then hand over to acceptance

[Verify in the browser](#verify-in-the-browser) the whole user task against the real backend: loading, create, edit, delete, saved results and refresh, page and endpoint permissions, and the empty and failure states. Then start the [independent acceptance](#independent-acceptance) and fix what it finds.

## Verify in the browser

1. Reuse the running application or start it with `pnpm dev`, and open the `Local:` URL it prints (for example `http://127.0.0.1:13000/main/`) with the page path appended. Sign in and capture on exactly that host: sessions for `127.0.0.1` and `localhost` are not interchangeable. Never enter a password for the user; ask them to sign in.
2. Take screenshots with the [screenshot tool](scripts/capture.md), from the application root:

   ```bash
   node .agents/skills/nocobase-app-development/references/frontend/scripts/capture.mjs login --base http://127.0.0.1:13000/main/
   node .agents/skills/nocobase-app-development/references/frontend/scripts/capture.mjs shoot --spec storage/ui-workflow/<feature>/capture.json
   ```

   Give each changed view a shot at 1440×900 and one at 390×844 with `"isMobile": true`, plus dark mode and the other language where copy or colors changed.

3. Note console errors on a baseline page (such as the home page) first; those come from the shell. `/.vite/deps/` 404 or 504 responses after a new dependency vanish on reload.
4. Walk the task, not just the screenshot: type character by character and with Chinese IME composition (the tool's `type` and `ime` steps), simulate failures with `block` (network, retryable) and `fulfill` with 403, 404 and 500, and use Playwright assertions for focus, disabled buttons and request counts. Check permission-dependent states as [`references/page.md`](references/page.md) describes, and asynchronous transitions as [`references/testing.md`](references/testing.md) describes.
5. Report what you cannot check (no browser, session or device) as Not verified, with the reason.
6. Delete the records you created, or list them in the report. Delete `storage/ui-workflow/auth.json` (and any other saved session) at the end: it holds live sign-in cookies. Keep the screenshots.

## Independent acceptance

For a new page or module, start a new subagent and give it the task, not your reasoning. Without subagents, do the pass yourself from the files and say so in the report.

```text
You are a UI acceptance reviewer. Do not modify the application.
Task and later user decisions: <task text>
Page plan: docs/ui/pages/<feature>.md
Changed files: <list>
Screenshots: storage/ui-workflow/<feature>/screenshots/ (look at each one)
Application URL and session: <Local URL>, storage/ui-workflow/auth.json
Check the pages as .agents/skills/nocobase-app-development/references/frontend/ui-acceptance.md describes, using its screenshot tool or a read-only Playwright script for anything the screenshots do not show. Report as that file describes.
```

Fix every problem it reports, recheck each fix with the flows it touches and retake those screenshots. There is no second review; what you cannot fix is reported as outstanding.

## Report

Keep the final report short:

- **Workflow and what was done**: user tasks, routes, changed files, the page plan's path.
- **Checks**: the commands run and their results; what was checked in the browser at 1440 and 390, with the key screenshots (shown, or their paths).
- **Acceptance**: the problems found and how each was fixed (new pages only).
- **Outstanding**: anything not verified and why, test data left behind, and the command to remove the screenshots (`rm -r storage/ui-workflow/<feature>`).
