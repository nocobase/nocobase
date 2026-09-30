# Frontend development workflow

This is the entry point for the application's frontend work: read it before writing or changing anything under `client/` — pages, components, styles or copy. It decides which of three workflows a change takes and what counts as done:

- **Quick change**: edit directly, then run the static checks and the related tests and look at the changed element once in the browser.
- **Theme change**: change tokens or presets as [`references/theme.md`](references/theme.md) describes and verify with its theme tests and browser check.
- **Full workflow**: a design file reviewed once, development, then one independent acceptance review in the browser.

What the interface should look like is in [`ui-guidelines.md`](ui-guidelines.md); how to write the code is in [`frontend-dev.md`](frontend-dev.md). Paths in this document are relative to its own directory: [`ui-guidelines.md`](ui-guidelines.md) and [`frontend-dev.md`](frontend-dev.md) sit beside it, the topic references are under `references/`, the record templates and reviewer prompts are under `templates/`, and the screenshot tool is under `scripts/`.

## Choosing a workflow

Decide before you start, and say in one sentence in your reply which workflow you are following and why.

| Workflow      | When it applies                                                                                                                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full workflow | Any one of: a new page that loads data or has forms or overlays; a new complete interaction (a create/edit flow, a detail drawer, a multi-step operation); a change to the page structure or main interactions; one change that touches the layout or interactions of several pages; the user asks to see the design first |
| Theme change  | The change is to theme tokens or presets: the primary color, fonts, density, radius or shadows of the whole application, or adding, changing or removing a preset. Follow ["Theme change"](#theme-change) below. No design file unless the user asks                                                                       |
| Quick change  | None of the above applies. For example: changing copy; adjusting styling details on one page; adding a button, a column, a form field or a filter to an existing page; fixing a UI bug; a refactor that changes neither appearance nor behavior                                                                            |

When unsure, explain the difference in one sentence (the full workflow adds a design, a design review and an independent acceptance review) and let the user choose. A quick change needs only the next section; a theme change needs only [`references/theme.md`](references/theme.md).

## Theme change

- To change a preset: [section 4 of `theme.md`](references/theme.md#4-change-or-remove-a-preset), keeping the ["Constraints from the token test"](references/theme.md#constraints-from-the-token-test) of section 2.
- To add a preset: [section 3 of `theme.md`](references/theme.md#3-add-a-preset).
- Verify with [section 7 of `theme.md`](references/theme.md#7-verify): the theme tests, then the browser check it scales to the change.
- Report what changed, the checks you ran and what you looked at, as a quick change does.

## Quick change

1. Read [`frontend-dev.md`](frontend-dev.md) and the references under `references/` related to the change; when the change adds or uses a primitive the page has not used before, also [`references/shadcn.md`](references/shadcn.md). When the change affects how the interface looks or behaves, also read the relevant guidelines in [`ui-guidelines.md`](ui-guidelines.md), and at minimum check the relevant items of the "Review checklist" at its end.
2. Follow how the page is already written: keep components, spacing and copy style consistent with what surrounds the change.
3. Run the checks in ["Self-check before finishing" in `frontend-dev.md`](frontend-dev.md#self-check-before-finishing): type checking, lint and formatting of the changed files, and the existing tests that cover them.
4. A change that adds or alters behavior (a column, filter, button or field) extends the component test of that page, or adds one when there is none; a bug fix a component test can reproduce adds that test; a copy-only or styling-only change needs none (see [`references/testing.md`](references/testing.md)).
5. When the change is visible at runtime — copy, styling, a new column, filter or button, a UI bug fix — start or reuse the application and sign in as item 1 of [step 4.1](#41-run-check-main-agent) describes (the printed `Local:` URL, the same host, no password entered by you), open the page once and look at the changed element: copy in both languages, styling in light and dark, at 375px and, when spacing, type, radius or shadow changed, in both presets (in the browser, or with two or three shots of the screenshot tool, [`scripts/capture.md`](scripts/capture.md)), a bug fix by reproducing the original steps. If no browser or sign-in session is available, say so in the report instead of claiming it works.
6. Report what you changed, which checks and tests you ran with their results, and what you looked at in the browser. If you saved a sign-in session for the check, delete `storage/ui-workflow/auth.json` (and `auth-limited.json`) first: they hold live sign-in cookies.

A quick change writes no design file or run record and starts no reviewer subagent. If partway through you find the change goes beyond a quick change (for example, it needs a new interaction or a change to the page structure), stop, explain the situation, and switch to the full workflow.

## Full workflow

Five steps: design → design review → development → acceptance review → report. The design review and the acceptance review each happen once; there is no loop.

### Roles

- **Main agent**: writes the design, writes the code, fixes issues.
- **Reviewer**: a new subagent (with its own context) for the design review, and another for the acceptance review. Give it only the guidelines, the design file, the screenshots, the run record and the changed files — not your reasoning. The reviewer only reports issues and does not modify files. If the environment does not support subagents, re-read everything from the files and do the review yourself as a separate pass, and mark the record "Non-independent review".
- **User**: confirms the design and has the final say on design changes.

### Artifacts

Everything goes in `storage/ui-workflow/<feature>/` (`storage/` is ignored by git). `<feature>` is kebab-case and matches the route name:

| File                           | Contents                                                                                         | Template                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `design.md`                    | Design file                                                                                      | [`templates/design.md`](templates/design.md) |
| `review-design.md`             | Design review record (written by the reviewer)                                                   | [`templates/review.md`](templates/review.md) |
| `run.md`                       | Run record (written by the main agent)                                                           | [`templates/run.md`](templates/run.md)       |
| `acceptance.md`                | Acceptance record (the reviewer writes the issues; the main agent writes the fixes and rechecks) | [`templates/review.md`](templates/review.md) |
| `capture.json`, `screenshots/` | Screenshot configuration and acceptance screenshots                                              | [`scripts/capture.md`](scripts/capture.md)   |

These files are used only while the task is in progress: the reviewer and the main agent hand work over through them, and the report is compiled from them. When the task ends (step 5), delete `design.md`, `review-design.md`, `run.md`, `acceptance.md` and `capture.json`: once the page is implemented, the code is the authority on how it was designed, and a leftover document only goes stale. Keep `screenshots/` (with its `capture-log.json`) for the user to look at.

### Step 1: Design

1. Read all of [`ui-guidelines.md`](ui-guidelines.md) and [`templates/design.md`](templates/design.md). Then, from ["Look up by task" in `frontend-dev.md`](frontend-dev.md#look-up-by-task), read the sections of the rows the page needs, and ["Error handling" in `api.md`](references/api.md#error-handling): enough to confirm that its routes, permissions, overlays and data updates can be implemented. The complete files in [`references/example.md`](references/example.md) are for step 3.
2. Work out the data:
   - The endpoint exists: read its implementation or documentation, and copy its fields, parameters, response shape and error codes into the design.
   - The endpoint does not exist: specify the endpoint you need in the design; the backend is implemented to that contract.
3. Take stock of the available components: `client/components/ui/` (primitives) and `client/components/` (compositions). The design uses only existing components or components the shadcn registry can add; list every primitive it needs that is not installed yet, so development starts with one `yes n | pnpm exec shadcn add` run ([`references/shadcn.md`](references/shadcn.md)), and say so when it needs a new component of its own. Open the source to confirm any component behavior the design depends on (default width, footer button alignment, how tables paginate and sort, overlay nesting); the file name alone is not enough.
4. Write `design.md` from the template: choose a page template (guidelines T1–T5), draw a wireframe, and list the components, states, interactions and copy.
5. Write the acceptance criteria, numbered D1, D2, …, each one checkable by an action or a screenshot; step 4 checks them one by one. When the design changes later, keep existing numbers unchanged, append new criteria at the end, and mark removed ones "Deleted", so that references in the review records still match.

When done, set the status in `design.md` to "Pending review".

### Step 2: Design review (once)

1. Start a new subagent and review with the ["Design review prompt" in `templates/prompts.md`](templates/prompts.md#design-review-prompt); the record goes in `review-design.md`. Issues are classified as blocking or suggestion and cite guideline IDs.
2. If there are blocking issues: revise the design, and record how each issue was handled in the design's "Review responses" section (give a reason for each suggestion you do not adopt). There is no second review.
3. Ask the user to confirm: in a few sentences, summarize the page structure, the main interactions, the issues the review found and how they were handled, and the questions awaiting the user's decision, and include the path to `design.md`.
   - Once the user confirms, set the status to "Confirmed" and move on to development.
   - If the user has already said explicitly not to wait for confirmation and to finish in one go: record that in `design.md`, continue with development, and summarize the design in the final report so it can be confirmed afterwards.

The confirmed design is the basis for development and the acceptance review.

### Step 3: Development

1. Read the documents the task table of [`references/example.md`](references/example.md) names, then write the feature's files from `design.md`. Copy a file unchanged only where a document says it is shared infrastructure, as `session-expired-alert.tsx` and `use-url-search.ts` are. Return to the topic references read in step 1 only for a rule the design did not need.
2. Implement according to `design.md`: every item in the component list, every state, every interaction and every piece of copy must have a matching implementation.
3. When new backend endpoints are needed, implement them to the endpoint contract in the design (for backend code, see [`../server-routes.md`](../server-routes.md), [`../migrations.md`](../migrations.md) and [`../database-and-data.md`](../database-and-data.md)).
4. When the design contains decisions that the code does not show by itself but that anyone changing this page later needs to know (for example, why an approach was not used, or what limits an endpoint has), write them as code comments. `design.md` is deleted when the task ends.
5. Cover the page's key behavior (state changes, submission, error handling) with component tests in `tests/components/`, written as [`references/testing.md`](references/testing.md) describes, and add a new App page to the route test ([section 12 of `references/page.md`](references/page.md#12-update-the-route-test)).
6. Move on to step 4 only after every check in ["Self-check before finishing" in `frontend-dev.md`](frontend-dev.md#self-check-before-finishing) passes.

If you find during development that the design is not feasible, follow "Design changes".

### Step 4: Acceptance review (once)

#### 4.1 Run check (main agent)

1. If the application is running, reuse it; if not, start it with `pnpm dev` and open the `Local:` URL it prints, which ends with the deployment base path and a slash (for example `http://127.0.0.1:13000/main/`), with the page's path appended without its leading slash (`…/main/projects`). Sign in and take screenshots on exactly that host: sessions for `127.0.0.1` and `localhost` are not interchangeable. If the page requires sign-in and there is no sign-in session, ask the user to sign in themselves; do not enter a password for the user. The screenshot tool's `login` opens a visible browser window; in an environment without a display, ask the user to run it where a window can open and hand over `storage/ui-workflow/auth.json`, or record the browser checks as "Not verified" with that reason.
2. Prepare data: take a screenshot of the "empty" state first, then create enough test data through the UI or the endpoints (covering the different statuses, empty fields, long text and pagination). When the checks change data, note how you prepared it and how to clean it up. When the checks are done, delete the records you created, or list them in the report so the user can.
3. First capture a baseline on an existing page (for example, the homepage): console errors already present in the baseline come from the application shell; record them as "Already in baseline" — they are not issues of this feature. When a new page pulls in a dependency for the first time, Vite re-runs dependency pre-bundling, and a few 404 or 504 ("Outdated Optimize Dep") responses for `/.vite/deps/` may appear; they disappear after a reload and are not page issues either.
4. Following the interactions in `design.md` one by one, walk through the core flow (for example, create → appears in the list → edit → delete), and cover every state: loading, empty, no results, failure. Compare the design's declared structure with the code as well — routes, navigation entries and their icons, permissions — not only the numbered criteria.
   - Type text character by character, and edit in the middle of existing text; for search boxes and form text fields, also simulate Chinese IME composition. Use the `type` and `ime` steps of the screenshot tool ([`scripts/capture.md`](scripts/capture.md)), or the same calls in your own script: `page.keyboard.type`, and a CDP session sending `Input.imeSetComposition` for each intermediate pinyin state and `Input.insertText` for the chosen characters. Filling in a value in one go (`fill`) cannot reveal an input falling out of sync with its state.
   - For states that depend on permissions (a hidden page, a denied tab, a read-only card), follow ["Checking permission states in the browser" in `references/page.md`](references/page.md#checking-permission-states-in-the-browser).
   - For results a screenshot cannot show, such as where focus goes, whether a button is disabled, or how many requests are sent, write Playwright script assertions (put them under `storage/ui-workflow/<feature>/`).
   - Simulate failure states per status: `block` for a network failure (the retryable state), `fulfill` with `status: 403` or `404` for the states that offer no "Retry", `500` for a server error. `offline` also cuts Vite's hot update connection, and the page does a full reload when the network comes back.
   - Record any state you cannot simulate as "Not verified" and give the reason.
5. Record console errors, failed endpoint requests (4xx, 5xx, except those the check caused on purpose) and page errors.
6. Screenshots: one per key state, saved to `screenshots/`, with file names matching those referenced in the acceptance criteria. The screenshot tool ([`scripts/capture.md`](scripts/capture.md)) takes them in batch, in both color modes, both presets and at narrow widths, and collects console errors and failed requests at the same time.
7. Write the run record `run.md` from [`templates/run.md`](templates/run.md).

#### 4.2 Independent review (new subagent)

Use the ["Acceptance review prompt" in `templates/prompts.md`](templates/prompts.md#acceptance-review-prompt); the record goes in `acceptance.md`. The reviewer sorts issues into four types:

| Type                  | Meaning                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B Blocking            | Unusable: a blank screen or an error, the core flow cannot be completed, data is not saved or is saved wrongly, an action gives no feedback, console errors, access beyond permissions (seeing or changing data that should not be visible)                                                                                   |
| D Design mismatch     | The whole design file is compared with the code: the acceptance criteria (D1…Dn) one by one, and the routes, navigation entries (including their icons), permissions, component list and states it declares; any item that does not match, and anything carried over from the worked example that the design does not ask for |
| G Guideline violation | Violates a guideline marked Must in [`ui-guidelines.md`](ui-guidelines.md)                                                                                                                                                                                                                                                    |
| S Suggestion          | Anything else that could be improved                                                                                                                                                                                                                                                                                          |

#### 4.3 Fixes and rechecks (main agent)

- Only S issues, or no issues: the acceptance review passes. You may fix S issues along the way; list the ones you do not fix in the report.
- B, D or G issues: fix all of them, then recheck them yourself; do not start a second reviewer:
  1. Rerun the self-checks from step 3.
  2. Exercise each fix again, one at a time, along with the flows related to it: a fix can introduce new issues — for example, if you changed the save logic, walk through create, edit and delete again.
  3. Retake the screenshots whose view has changed.
  4. In the "Fixes and rechecks" section at the end of `acceptance.md`, record for each issue how you fixed it, how you rechecked it, and the result.
- Issues you cannot fix, or that need a design change: follow "Design changes", or list them in the report as outstanding, with the reason.

### Step 5: Report

The final report includes:

- **What was done**: pages, routes, changed files.
- **Design**: whether the user has confirmed it; the list of design changes.
- **Acceptance review**: which issues the review found; the results of the fixes and rechecks.
- **Screenshots**: attach or display the key screenshots when the client can show images; otherwise give their paths.
- **Outstanding**: unresolved issues, and what was not verified and why.

Cleanup: before the report, delete `design.md`, `review-design.md`, `run.md`, `acceptance.md` and `capture.json`, and the sign-in sessions `storage/ui-workflow/auth.json` (and `auth-limited.json`, if you made one), which hold live sign-in cookies. Keep `storage/ui-workflow/<feature>/screenshots/` so the user can look at them, and end the report with the command that removes it (`rm -r storage/ui-workflow/<feature>`). Skip the cleanup when the user asks to keep the files.

### Design changes

When development or the acceptance review shows that the design is not feasible (endpoint limits, something a component cannot do, conflicting interactions), or that it needs adjusting:

1. Pause development of the affected parts.
2. In the "Change log" of `design.md`, record what changed, why, and which acceptance criteria it affects.
3. For a small change (one that does not affect the page structure or the main interactions), record it and continue, and list it in the final report; for a large change, ask the user to confirm first.

Do not implement a design you know is flawed just to "match the design", and do not deviate from the design without leaving a record.
