# UI acceptance

What the independent acceptance agent of [the new-page workflow](ui-workflow.md#independent-acceptance) checks, and how it reports. A page change checks the items that its change touches. The rules themselves live in [`ui-guidelines.md`](ui-guidelines.md) (cited by ID) and [`mobile.md`](mobile.md); this file does not restate them.

Check the running application in a browser at 1440 px and at 390 px with phone emulation (`isMobile`, `hasTouch`), using the [screenshot tool](scripts/capture.md) or a read-only Playwright script under `storage/ui-workflow/<feature>/`. Do not create, change or delete data beyond what the check needs, and never print cookies.

## What to check

- **The user task works end to end.** Against the real backend: the list loads, create, edit and delete save and the views that show the record refresh, page and endpoint permissions hold (also for a user without them), and empty, no-results, failure and expired-session states appear. Console errors (beyond the baseline) and unexpected 4xx/5xx requests are problems.
- **The page plan is implemented.** Routes, menu entry and icon, list/detail/form choices, primary row actions, data scopes and phone layout match `docs/ui/pages/<feature>.md`. Anything left over from the runnable example that the plan does not ask for (`skill-projects` names, fields, copy keys, columns, widths) is a problem.
- **Components are reused.** Imports and local wrappers follow the selection order in [`design-contract.md`](design-contract.md); review the component checker's output and every printed exception. A hand-built duplicate of an existing component is a problem even when it looks right.
- **Page templates and overlays** follow the T and I rules of [`ui-guidelines.md`](ui-guidelines.md): forms in a `RouteDialog`, detail as drawer or page by record size, row actions in the `RowActions` menu (T1.5).
- **Unsaved input (T3.9).** Type into the create and the edit form, then try Cancel, ×, Esc, the backdrop, browser back and a reload: each asks "Discard changes?". Changing only a select, date or upload field asks too. Changing a value back, or saving successfully, leaves without asking; "Keep editing" keeps the input. While a save is in flight the primary button shows its pending label and is disabled.
- **Phone at 390 px**, as [`mobile.md`](mobile.md) describes: main content on the first screen, cards instead of a sideways-scrolling list, filters and sort reachable, no page overflow (`document.documentElement.scrollWidth <= innerWidth`) with long Chinese and English text, forms and overlays usable at a short height, the main task completed by touch.
- **Overlay geometry**: with long content and long labels, the body scrolls, the footer buttons stay visible and clickable, and validation errors and pending states do not push them out. Closing returns to the view the overlay opened from, with its search, filters and page intact.
- **Input and states**: typing character by character and with Chinese IME keeps the input in sync; focus is visible and returns after an overlay closes; every control has an accessible name; dark mode and both languages read correctly.

## How to report

Return a verdict and a list:

- **Pass**: every check above that applies was verified and nothing failed.
- **Problems**: one line each, giving the page (route), the width (1440 or 390), the rule (guideline ID such as T1.5, the `mobile.md` section, or "plan" or "task"), what happens, and the screenshot file or code location that shows it.
- **Not verified**: each check that could not be made, with the reason (no session, no device for the soft keyboard, an endpoint unavailable). A check without evidence is never reported as a pass.

Report only; do not fix. The main agent fixes the problems and rechecks them.
