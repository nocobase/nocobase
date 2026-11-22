# UI guidelines

The visual and interaction rules for NocoBase 3 application pages and plugins. Workflow: [`ui-workflow.md`](ui-workflow.md); design references and components: [`design-contract.md`](design-contract.md); phone judgement: [`mobile.md`](mobile.md); implementation: the linked `references/*.md`. Cite rules by ID ("violates T1.5").

Breaking a [Must] rule is a real defect for users. Other rules are defaults: depart only for a reason stated in the page plan or final report. Uncovered situations follow the closest rule. Shared components implement most rules; use their props rather than restyling them.

## F Foundations

**F1** Colors come only from semantic tokens (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `variant='destructive'`…; mapping in [`references/styling.md`](references/styling.md)), never literals such as `bg-white` or `#1677ff`.

**F2** Font sizes come from the scale: `PageHeader` sets the title, section titles use `text-base font-medium`, body, tables and forms keep the components' `text-sm`, helper text is `text-sm text-muted-foreground` or `text-xs`. No arbitrary values such as `text-[13px]`.

**F3** Spacing comes from the scale: `PageContainer` spaces sections, stacked blocks use `flex flex-col gap-4` or `gap-6`, cards keep the `Card` padding and their content lines up with the card title, related controls use `gap-2`. No arbitrary values such as `mt-[7px]`.

**F4** Radius and shadow use component defaults, or utilities such as `rounded-lg` and `shadow-sm`.

**F5** Icons come from lucide-react; a button sizes its own icon, a standalone icon uses `size-4`.

**F6** Everything stays readable in the light and dark themes.

**F7** A literal size (a control width, an image size) is allowed where genuinely needed and explained in the report, except for color, font size or spacing; the layouts in `references/styling.md` and the classes of I1, I12 and I13 need no explanation.

## L Page structure

**L1** A business page is a `PageContainer` with a `PageHeader`: a noun title, a one-sentence description and page-level actions on the right of the title row (never wrapped below the description from `sm` up). On a phone `PageHeader` keeps one primary action beside the title and moves the rest into a "More" menu.

**L2** A view (page, dialog, drawer, settings Card) has at most one primary (default-style) button; others are outline, ghost, destructive or in a menu.

**L3** The page title matches its menu entry.

**L4** Lists and tables use the full width; form and reading pages limit content to `max-w-2xl`–`max-w-4xl`.

**L5** Page actions go in the `PageHeader`, record actions in the record's row or detail view, bulk actions appear only after records are selected.

**L6** A detail or edit view shows its parent: the shell renders the breadcrumb on desktop and a named back arrow on a phone, keeping the source list's query; never add a second back button. Mechanics: [`references/navigation.md`](references/navigation.md).

**L7** The list's create action appears only in the `PageHeader`, never again in the empty state, and only once the create permission resolves as allowed.

**L8** A count beside a menu entry is only what waits on the viewer (unread, to decide, assigned), never a record total; zero shows nothing. See [`references/page.md`](references/page.md).

## T Page templates

### T1 List page

Top to bottom: `PageHeader` with "New X" → toolbar (search and filters left, secondary actions right) → table → pagination. A short list inside a dashboard card follows T5.3 instead. Build it from [`references/table.md`](references/table.md).

- **T1.1** Search is `DataTableSearch` from `#components/data-table`, never a hand-made input; its placeholder names the searched fields ("Search by name or email").
- **T1.2** Filters show their current value; while any search or filter applies, "Clear filters" is shown.
- **T1.3** The first column is the record's name or number, rendered with `RecordLink`; it opens the detail view. No separate "View" action or column.
- **T1.4** Enumerated values (status, type) are text in a `Badge`; color only supports the text.
- **T1.5 [Must]** Row actions go in the `RowActions` "⋮" menu at the end of the row (`#components/row-actions`), including a single action and in every record state. Up to two primary actions named in the page plan may be shown outside the menu through `exposed`; nothing else is. Destructive items come last and are confirmed (I2); actions the viewer may not take are left out, and no menu renders when none remain. The actions column has no visible header and is not pinned. `scripts/check-ui-components.mjs` enforces the details.
- **T1.6** Dates and times are formatted for the current language; numbers are right-aligned with thousands separators.
- **T1.7** Search, filters, sort and page live in the URL, so a refresh or back keeps them ([`references/table.md`](references/table.md)).
- **T1.8** Date, time, number and name columns are sortable; status, type, people, long text and yes/no columns are not unless their order means something. The default order is last updated, newest first.
- **T1.9** A list handles every state in S1–S4.
- **T1.10** When results are capped (a browser-sorted page, or no total from the endpoint), say so ("Only the first N records are shown…"); records never silently disappear.
- **T1.11** A cut-off table cell ends in an ellipsis and shows its full content on hover.
- **T1.12** Pagination wraps whole groups at narrow widths instead of shrinking labels.
- **T1.13** On a phone an ordinary list renders cards (`renderCard`, M3.1 in [`mobile.md`](mobile.md)).

### T2 Detail view

- **T2.1 [Must]** A record with at most about 15 fields opens its detail in a `RouteDrawer` at `:id` over the list; a complex record (more fields, tabs, related lists) gets a detail page at `:id/details`. Editing is a `RouteDialog` at `:id/edit` (T3.1). Route mechanics: [`references/page.md`](references/page.md) and [`references/child-routes.md`](references/child-routes.md).
- **T2.2** The top shows the record name; record actions (edit, delete) are grouped in one place at the top or bottom.
- **T2.3** The detail opens directly by URL and survives a refresh (I6).
- **T2.4** Fields are "label — value" pairs; an empty value shows "—", multi-line text keeps its breaks, long values wrap without breaking the layout.
- **T2.5** Particulars may use the UI Library `property-fields` card (`variant='inline'`, double-click to edit); the Edit action stays for touch.

### T3 Forms

Build forms from [`references/form.md`](references/form.md).

- **T3.1 [Must]** Every create and edit form opens in a `RouteDialog`: create at `new`, edit at `:id/edit`. No create or edit forms in drawers or covering pages; a long form groups its fields and scrolls inside the dialog.
- **T3.2** Labels sit above inputs; required fields get `*`, optional ones nothing.
- **T3.3 [Must]** Validate on submit, then revalidate a field as it changes; errors appear below the field and say how to fix it, and focus moves to the first error.
- **T3.4** The footer is right-aligned, "Cancel" then the submit button, which names the action ("Create", "Save"); narrow screens keep the components' stacked footer.
- **T3.5 [Must]** While submitting, the submit button shows its pending state and is disabled, Cancel is disabled and the overlay cannot close.
- **T3.6 [Must]** On failure the form stays open with its input: server field errors appear under their fields, other failures in an `Alert` at the top.
- **T3.7** On success the dialog closes, related views refresh (R2) and a toast names the result (`Created customer "Zhang San"`).
- **T3.8** An edit form loads the record's latest data before prefilling (skeleton while loading; a failure or missing record follows S4 and R3).
- **T3.9 [Must]** Unsaved input is never lost silently: build every create and edit form with `FeedbackForm` (`#components/feedback-form`), passing `values={form.getValues}` (or `values={() => values}` for `useState`) and `savedValues` (the stored record or the blank create values, never a restored draft), inside its route overlay. The overlay then asks "Discard changes?" on every way out (Cancel, ×, Esc, backdrop, browser back, links) and leaves without asking after a successful save. Pages write no guard of their own. Mechanics: [`references/overlay.md`](references/overlay.md).

### T4 Settings page

- **T4.1** One `Card` per topic, each with a title and a one-sentence description.
- **T4.2** Each Card saves on its own, with Save at its bottom right.
- **T4.3** A toggle applies at once with a toast; a setting that needs input applies on Save.

### T5 Dashboard

Top to bottom: `PageHeader` (whole-page actions only) → metric cards → charts → lists of records that need attention, each in a card.

- **T5.1** A metric card shows its label above a large, localized value; a change states its direction in words or a sign, not color alone.
- **T5.2** Each chart sits in a titled Card; labels and tooltips are translated and colors come from the chart tokens.
- **T5.3** A list in a card shows at most 10 rows, no search, filters, sorting or pagination, and links to the full list ("View all"); its records open over the dashboard (I9).
- **T5.4** Each card has loading, error and no-data states of its own (S1, S2, S4).
- **T5.5** On a phone, metric cards sit two per row and charts one per row ([`mobile.md`](mobile.md)).

Boards, calendars and other pages without a template follow F, L, I, R, S, C and A; the page plan explains their structure.

## I Interaction choices

**I1 [Must]** Choose the overlay by what it holds:

| What it holds                                    | Use                         | Width                                      |
| ------------------------------------------------ | --------------------------- | ------------------------------------------ |
| Confirming an action                             | `AlertDialog`               | default                                    |
| Creating or editing a record (T3.1)              | `RouteDialog`               | `sm:max-w-md` for 1–4 fields, else default |
| A record's details over the list (T2.1)          | `RouteDrawer`               | default; `sm:max-w-2xl` for a wide table   |
| Large read-only content (a diff, a file preview) | `Dialog`                    | `sm:max-w-4xl`, scrolling body             |
| A few options or quick actions                   | `DropdownMenu` or `Popover` | sized to content (I13)                     |

Every confirmation is an `AlertDialog`. A plain dialog that can outgrow the screen caps itself at `max-h-[calc(100dvh-2rem)]` with a fixed header and footer and a scrolling body; `RouteDialog` and `RouteDrawer` already do. The deepest stack is drawer → dialog → confirmation; Esc and the backdrop close only the top layer. Details: [`references/overlay.md`](references/overlay.md).

**I2 [Must]** Destructive actions (delete, disable, revoke, clear) open an `AlertDialog` first whose title names the object (`Delete customer "Zhang San"?`), whose description states the consequence and whose confirm button is destructive and names the action.

**I3 [Must]** Feedback: success is a one-sentence toast; validation errors are inline; a failed request in a dialog shows inside the dialog, which stays open; a failed page load is an in-page state (S4); a failed one-click action is an error toast. Never show raw backend messages, stack traces or SQL.

**I4** Loading: a button shows its own pending state; a same-query refresh keeps the rows with the shared refresh indicator; a new query never shows the previous results as current. Timing: [pending feedback](../pending-feedback.md).

**I5** Search applies about 300 ms after typing pauses (`DataTableSearch` does this).

**I6 [Must]** Create and edit dialogs and detail drawers have their own URL: a link opens them, a refresh restores them, back and forward close and reopen them. Only single-action confirmations and temporary panels stay out of the URL.

**I7 [Must]** Actions the viewer may not take are hidden; temporarily unavailable ones are disabled with a reason (a tooltip, unless the reason is visible). Hiding is not a permission check: the server enforces it.

**I8** Everything works with the keyboard; do not break the components' focus, Esc and Enter handling.

**I9 [Must]** A record or overlay opens over the view the user is on (a filtered list, a dashboard, the current tab), at that view's URL plus its own segments, and closing returns to exactly that URL. Never send the user to another page's route for a record. Mechanics: [`references/child-routes.md`](references/child-routes.md).

**I10** Dates are picked with the application's `DatePicker` (Calendar in a Popover), never a native date input; a range offers presets ([`references/form.md`](references/form.md)).

**I11** A plain `Sheet` holding a form or details is medium width (`w-full gap-0 data-[side=right]:sm:max-w-xl`).

**I12** Every `SelectContent` grows with its options and wraps long ones: `className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'`.

**I13** A `DropdownMenuContent` on an icon or narrow trigger gets `className='w-auto min-w-40'` (`RowActions` already does).

**I14** Long prose never ends in a mid-sentence ellipsis: show up to five lines and unfold in place (`LongText`), or three muted lines with a pop-up in a narrow column (`LongTextPreview`), both from the UI Library `@nocobase/long-text`. Table cells keep `truncate`.

## R Data freshness

How to keep views current is [`references/data-changes.md`](references/data-changes.md).

**R1** Edit and delete work from the record's latest data (T3.8), so a write never overwrites someone else's change.

**R2 [Must]** After a successful write the UI shows the new state at once: the current view uses the returned data, and every affected list, card and count refreshes through scopes (views declare `scopes` in `useListData`, writes call `announceDataChange({ scopes, results })`). Never pass a `reload` callback through Outlet context or `onSaved`.

**R3** When an action or open reveals the record no longer exists (404), say "This record does not exist or has been deleted", offer the next step (close, back to the list) and refresh the list; no Retry.

**R4** Ordinary pages have no Refresh button; Retry appears only after a failed read (S4). Business operations (rescan, sync) stay explicit actions with descriptive labels.

## S States

`DataTable`, `ListFeedback` and `RefreshIndicator` implement S1–S4; never hand-write spinners or status blocks ([`references/table.md`](references/table.md#7-list-feedback-states)).

- **S1 [Must]** Loading, empty, no results and failure are distinct states: loading shows the shared indicator; empty ("No data yet") is distinct from no results ("No results"), and "Clear filters" lives in the toolbar.
- **S2** The empty state is one line with an icon and no actions; the create action stays in the `PageHeader` (L7).
- **S3** A search or filter that matches nothing is no results, not empty, and never hides the header's create action.
- **S4** A failed load shows one line with an icon ("Unable to load list", "Access denied", "Session expired"); retry and sign-in live in the toolbar or the auth flow. A failed refresh keeps the previous data and adds one stale-data line.
- **S5** Submitting uses `PendingButton` (T3.5, [pending feedback](../pending-feedback.md)).
- **S6** A block the viewer may not see explains itself rather than staying blank.
- **S7** Loading and retry never remove navigation, shift the layout, erase input or jump focus.

## C Copy

- **C1 [Must]** All visible text, including aria-labels, placeholders, toasts and validation messages, is translated into every language in `client/locales/index.ts` ([`references/i18n.md`](references/i18n.md)).
- **C2** The same concept uses the same word everywhere.
- **C3** Page actions are "verb + object" ("New customer"); buttons in a record's context or a dialog are the verb alone ("Edit", "Save").
- **C4** Default list feedback is one short line with an icon.
- **C5** A description is one sentence; a toast is at most about 12 English words (20 Chinese characters) plus the record name.
- **C6** Copy about a record includes its name: `Deleted customer "Zhang San"`, `已删除客户“张三”`.
- **C7** Overlay titles are "verb + object" with the opening button's verb ("Edit customer"); confirmations include the record name.

## A Accessibility and adaptation

- **A1** Icon buttons have an accessible name; one that acts on its own has a tooltip.
- **A2 [Must]** Information is never conveyed by color alone.
- **A3** Focus is visible and consistent.
- **A4 [Must]** Every page works on a phone without being asked, following [`mobile.md`](mobile.md): main content on the first screen, no sideways page scrolling, cards for ordinary lists, every task possible by touch.
- **A5** Text contrast meets WCAG AA in every theme.
- **A6** When an action removes the focused element (a deleted row, a closed drawer), focus moves to a stable place.
- **A7** Inputs support IME composition and mid-text editing; the URL, responses or refreshes never overwrite what the user is typing.
- **A8** Informational notices do not use alert semantics; only errors do.

## Review checklist

- [ ] Template, route tree and overlays match the page plan (T1–T5, T2.1, T3.1, I1)
- [ ] One primary button per view; actions in their places; create only in the header (L2, L5, L7)
- [ ] Row actions in the `RowActions` menu, exposed ones named in the plan (T1.5)
- [ ] Search with `DataTableSearch`, filters, sort and page in the URL (T1.1, T1.2, T1.7, T1.8)
- [ ] Loading, empty, no results, failure and denied states all render correctly (S1–S6)
- [ ] Forms validate on submit, block while submitting, keep input on failure (T3.3, T3.5, T3.6)
- [ ] A dirty form asks "Discard changes?" on every way out and not after saving (T3.9)
- [ ] Destructive actions confirmed with the object named (I2)
- [ ] Overlays have URLs and open over the current view; closing returns to it (I6, I9)
- [ ] Writes refresh affected views through scopes (R2)
- [ ] No raw backend errors; denied actions hidden (I3, I7)
- [ ] Tokens, scales and lucide icons only (F1–F5)
- [ ] All copy translated and consistent (C1–C3, C6, C7)
- [ ] Works on a phone at 390 px (A4, [`mobile.md`](mobile.md))
- [ ] Readable in the dark theme; keyboard and focus work (F6, A1–A3, A6)
