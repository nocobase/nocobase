# Dialogs, drawers and confirmation dialogs

How to build overlays with the template's components. Which overlay to use and how wide is I1 in [`../ui-guidelines.md`](../ui-guidelines.md); the unsaved-input rule is T3.9 there. The form inside a dialog is [`form.md`](form.md); route declaration and the detail-page alternative are [`page.md`](page.md) and [`child-routes.md`](child-routes.md); refreshing other views after a save is [`data-changes.md`](data-changes.md). The runnable reference is the [executable list and edit example](executable-list-edit.md).

## 1. Choosing an overlay

- Create or edit a record, of any length: `RouteDialog` at `new` or `:id/edit`; a long form scrolls inside.
- Record detail with at most about 15 fields and no related lists: `RouteDrawer` at `:id`. More fields, tabs or related lists: a detail page at `:id/details` ([`child-routes.md`](child-routes.md)).
- Confirm one action (delete, disable, revoke): `AlertDialog`, component state.
- A small form that is not a record's create or edit (rename one value), or large read-only content (`sm:max-w-4xl`): `Dialog`, component state.
- A temporary panel that is no record or place (help): `Sheet`, component state.

Rules for all of them:

- Overlays that represent a record, form or detail are child routes even when the user did not mention routing: a link opens them, refresh restores them, back and forward work (I6). Never give `RouteDialog`/`RouteDrawer` an `open` prop or hold their open state in a component; route matching decides.
- An overlay opens over the view the user is on (I9) and closing returns there. A page that shows another feature's records declares that feature's drawer under itself ([The same drawer over another page](#the-same-drawer-over-another-page)).
- Stacking: a drawer may open a dialog or confirmation; a dialog may open only a confirmation. Esc and the backdrop close the topmost layer only. Drawer → edit dialog → confirmation is the deepest stack. The templates' `Dialog`, `AlertDialog` and `Sheet` render their backdrop with `forceRender` so a nested layer blocks the one below; keep it when re-adding those primitives.
- Imports: `#components/route-dialog`, `#components/route-drawer`, `#components/use-route-overlay`, `#components/ui/dialog`, `#components/ui/alert-dialog`, `#components/ui/sheet` (add missing primitives with `yes n | pnpm exec shadcn add alert-dialog sheet`).

## 2. Overlays as child routes

Declare the child route, place `<Outlet />` in the parent, render `RouteDialog` or `RouteDrawer` as the child page's root, close from inside with `useRouteOverlay()`, and put any form in a `FeedbackForm` with `values` and `savedValues`.

### 2.1 Declare the child routes

Routes, paths, `authz` inheritance and file layout belong to [`page.md`](page.md) and [`child-routes.md`](child-routes.md). For overlays: create is `new` and edit is `:id/edit` (a `RouteDialog`), a small detail is `:id` (a `RouteDrawer`); child routes have no `navigation` and no `breadcrumb`; static segments such as `new` win over `:id`; new route names join the route test's grant list.

#### Declare the presentation

Give every route whose page renders `RouteDialog` or `RouteDrawer` a `presentation`, so the panel opens on the click instead of after the module, permission check and data arrive:

```ts
{
  name: 'project-new',
  path: 'new',
  presentation: { kind: 'dialog', title: 'projects.new' },
  componentLoader: () => import('./pages/projects/new.js'),
},
```

- `kind` is `'dialog'` or `'drawer'`, matching the component; `title` is a static translation key that does not depend on the record (a plugin registered under an application adds `namespace`). Permission checks, loading, denial and load failure render inside that panel.
- The page still renders `RouteDialog`/`RouteDrawer`; inside an opened panel it configures that panel (title, description, footer, `closeTo`, `beforeClose`, then `className` once ready). Slot elements (`title`, `description`, `footer`) render under the host, outside the page's providers: read translations with an explicit namespace and pass values as props.
- Without `presentation` the overlay appears only after loading, leaving a blank area under the list.

#### The same drawer over another page

A dashboard, board or another record's tab that shows records with an existing drawer declares that drawer (and its edit dialog) under its own route through a shared function, for example `children: projectDetailRoutes('project-dashboard')`, whose `owner` argument keeps route names unique. It links with a relative path, `{ pathname: project.id, search: location.search }`, never to `/projects/12`, which would leave the page. The drawer inherits the page's `authz` unless the function declares the projects grant. The mechanics are in [`child-routes.md`](child-routes.md).

### 2.2 Place the Outlet in the parent page

`RouteDialog` and `RouteDrawer` do not insert an `<Outlet />`; a page with children places a plain `<Outlet />` at the end of its `PageContainer`, and an overlay with its own children places one inside its body so the child stacks on it.

- Pass no `reload`, `onSaved` or `afterDelete` callbacks through Outlet context. A child route announces its write with `announceDataChange`, and every view that declared an overlapping scope updates ([`data-changes.md`](data-changes.md)). Keep Outlet context only for state that is not server data.
- Closing does not remount the parent: its scroll position and inputs stay. A covered list (`useListLocation().active === false`) sends no request and reads once on return ([`table.md`](table.md#6-loading-the-list)).
- Every link that opens an overlay keeps `location.search`, so the list behind keeps its search, filters and page.

### 2.3 Render with RouteDialog or RouteDrawer

Both take `RouteOverlayProps` (`client/components/route-overlay.tsx`):

- `title` (required `ReactNode`): heading and accessible name. `description`: the line under it. `children`: the body, which scrolls by itself.
- `footer`: buttons or a fragment, laid out right-aligned and stacked on narrow screens; no `DialogFooter` inside.
- `closeTo` (`To`): where closing goes; defaults to the parent route with the current search.
- `beforeClose` (`() => boolean | Promise<boolean>`): runs before ×, Esc, backdrop and `close()`; `false` keeps the overlay open.
- `dirty` (`boolean | (() => boolean)`): extra unsaved state the overlay cannot see ([2.5](#25-beforeclose-checks-before-closing)).
- `className`: width. Dialogs default to `sm:max-w-2xl`, drawers to `sm:max-w-xl`; a 1–4 field form passes `sm:max-w-md` (I1).

What they already do: fit the screen (`100dvh - 2rem`, full width on phones) with a fixed header and footer and a scrolling body; provide padding (no `PageContainer` inside); a × button, Esc and backdrop; close by navigating to `closeTo` with `replace`; move focus in on open and back to the opener on close (or to the parent panel when nested). When the opener is gone after closing (a deleted row), move focus to a stable place yourself (A6).

#### Asynchronous overlay lifecycle

Keep one stable `RouteDialog`/`RouteDrawer` for an opening and switch only its children between loading, error and content. Do not key the container by loading state or data version, and do not return a different component that creates a second overlay when the data arrives: that remounts the panel, replays its entrance and fights over focus. Key the record-specific child by its id when its form must reset. Verify with delayed responses in a real browser ([`testing.md`](testing.md)).

### 2.4 Close with useRouteOverlay

`useRouteOverlay()` returns `{ close, isClosing }`. `close()` runs `beforeClose`, then navigates; a second call while closing returns the same Promise. `isClosing` disables buttons such as Cancel.

Call it only in a component rendered inside the overlay (its body or footer). The page component that returns `<RouteDialog>` is outside the overlay's provider: there the hook throws, or in a nested overlay silently closes the outer layer. Split `CancelButton`, `EditBody` and similar into components and render them as JSX.

```tsx
function CancelButton({
  disabled,
}: {
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <Button variant='outline' disabled={disabled} onClick={() => void close()}>
      {t('actions.cancel')}
    </Button>
  );
}
```

Pass `closeTo` only for an overlay that wrote parameters of its own (a drawer with a search box closes to `{ pathname: '..', search }` with its own parameters removed from `search`). Never close with `navigate(-1)`: a directly opened overlay has no previous entry. When `beforeClose` can throw, handle `close()`'s rejection.

### 2.5 beforeClose: checks before closing

**The discard question is built in (T3.9).** Every `RouteDialog`, `RouteDrawer` and covering `RouteChildPage` asks "Discard changes?" ("Keep editing" / "Discard") on every way out (×, Esc, backdrop, Cancel through `close()`, browser back and forward, the phone's back gesture, links) and gets the browser's warning on reload, while a `FeedbackForm` inside has unsaved input. Pages write no question, `beforeunload` handler or draft-based `dirty` of their own.

- Give the form `values={form.getValues}` (`values={() => values}` for `useState`) and `savedValues`: the stored record as the form shows it, or the blank create values, never a restored draft. A page restoring a draft starts from it (`defaultValues: draft ?? saved`) and keeps `savedValues={saved}`, so leaving with the draft asks.
- Values are compared when the user tries to leave, so every field counts: typing, Select, date, relation picker, upload. Empty text, `null` and `undefined` are equal, dates compare by time, files by identity; a value changed back does not ask. Without `values`, typing in the form counts. `dirty` only adds state the form cannot show; `false` never switches the question off.
- The save leaves without asking when it navigates or calls `close()` while the `FeedbackForm`'s `onSubmit` is still running (await the request inside it). A plain `<form>` reports no save, so the question would appear after a successful save too; use `FeedbackForm` with a real `type='submit' form={formId}` button. `scripts/check-ui-components.mjs` rejects plain create/edit forms and a `FeedbackForm` without `values` and `savedValues`.
- A read-only drawer, or an overlay nobody typed in, does not ask.

**The only lock is a save in flight (T3.5):** `beforeClose={() => !submission.submitting}` with `submitting` from `useSubmission`. (A page that tracks its own flag reads a ref, not state, so a `close()` right after success does not see a stale `true`.) While submitting, Cancel and save are disabled.

**After an unknown outcome** (lost response, timeout, 5xx), `submission.pending` stays true so the same key can retry, but the request is over: `beforeClose` and Cancel's `disabled` read only `submitting`, never `pending`. The form keeps the input and shows the "may have been saved" message; Save retries with the same key; every way out asks "Discard changes?" because the values still differ from `savedValues`; "Keep editing" keeps the input and URL; "Discard" leaves. The key stays in session storage, so reopening the form offers the same retry. Blocking on `pending` would trap the person after every server failure.

A multi-step form is no exception: its `values` returns the input of every step, not only the fields on screen, and a write whose outcome is unknown can join it (`values={() => ({ input, pending: submission.pending })}`, `savedValues={{ input: stored, pending: false }}`) so leaving asks before the retry is given up. `OwnDiscardQuestion` belongs to the template's settings forms; application code never renders it or writes a `useNavigationGuard` or `beforeClose` that reads unsaved input, and `scripts/check-ui-components.mjs` reports both. `tests/client/skill-projects.test.tsx` and `tests/client/route-overlay.test.tsx` cover every way out.

During a permission recheck the shell keeps the allowed page hidden and refuses closing until the check settles; a settled denial unmounts the form. Keep `client-route.tsx`, `route-leave-boundary.tsx` and `route-overlay.tsx` together when merging template updates.

## 3. Complete example

The create/edit dialog is `client/pages/skill-projects/edit.tsx` in the [executable list and edit example](executable-list-edit.md); the detail is `detail.tsx` beside it. The worked projects feature (create dialog, detail drawer, edit dialog, delete confirmation, dashboard) is indexed in [`example.md`](example.md).

## 4. Delete confirmation (AlertDialog)

One component per record type (`project-delete-dialog.tsx`), used by the row menu and the detail. The opener keeps `{ open, project }` state.

- Keep the target when closing (set only `open` to `false`), so the title does not flash empty during the exit animation.
- The title names the record, the description states the consequence, the confirm button is destructive and says "Delete" (I2, C7).
- `AlertDialogAction` does not close by itself: close on success. While deleting, `onOpenChange` ignores close requests, both buttons are disabled and the confirm button shows progress (S5).
- On failure the dialog stays open and explains inside with `role='alert'` (I3); confirm stays enabled only when a retry can help. A 404 is "already deleted": an `info` toast, treated as success (R3).
- On success, announce `results: { [scope]: null }` ([`data-changes.md`](data-changes.md)) and move focus to a stable place, such as the list's search box, because the row and its menu are gone (A6). From a drawer, close the drawer.

## 5. Sheet: temporary panels

`Sheet` is for help or explanations that are no record or place; keep its state in the component. Use `SheetTrigger render={<Button variant='outline' />}` and `SheetClose render={<Button />}`, or `open`/`onOpenChange` on `Sheet`.

- `side` defaults to `'right'` at `w-3/4 sm:max-w-sm`. Widen with the side prefix, `className='w-full data-[side=right]:sm:max-w-xl'` (I11); a bare `sm:max-w-xl` loses.
- `SheetContent` does not scroll: give the body `min-h-0 flex-1 overflow-y-auto`.
- Replace the registry's English "Close" on the built-in button with `t('actions.close')` ([`shadcn.md`](shadcn.md)).

## 6. Plain dialogs: sizes and scrolling

`DialogContent` defaults to `sm:max-w-lg`, `p-6` and scrolls as a whole; check the installed source. For a fixed header and footer around a scrolling body:

```tsx
<DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-2xl'>
  <DialogHeader className='shrink-0'>…</DialogHeader>
  <div className='-mx-6 min-h-0 flex-1 overflow-y-auto px-6'>…</div>
  <DialogFooter className='shrink-0'>…</DialogFooter>
</DialogContent>
```

A small form passes only `sm:max-w-md`. `RouteDialog` and `RouteDrawer` are already built this way; pass them only a width.

### Footer ownership

A plain `Dialog` uses one `DialogFooter` directly in its content. `RouteDialog`/`RouteDrawer` take buttons in `footer` and supply the layout; never nest another `DialogFooter`, `SheetFooter` or padded wrapper there. The template's `client/styles.css` gives direct footer actions (buttons, `dialog-close`, `alert-dialog-action`, `alert-dialog-cancel`, and `Button render={<Link />}` with `nativeButton={false}`) one shared height and padding; do not patch sizes per page. Existing applications reconcile copied `styles.css` through the template upgrade Skill.

## 7. Verification checklist

- Create, edit and detail are child routes with the right container; a direct URL (with the base path), refresh, back and forward show the right layers.
- Closing, saving, Esc and back return to exactly the URL the overlay opened from, query included; the parent stays mounted.
- While saving or deleting, ×, Esc, the backdrop and Cancel do not close.
- After a 500 or a lost response the input stays, Save retries, every way out asks and "Discard" closes.
- After saving, the drawer shows the new values at once and the list updates (R2); a missing record shows its notice without Retry (R3).
- Esc closes only the top layer; focus returns to the opener or a stable place.
- At 390 px and in landscape the overlay fits, its body scrolls and the footer stays reachable ([`../mobile.md`](../mobile.md)).
- Without permission for the parent route, the child URL does not open.
