# Dialogs, drawers and confirmation dialogs

This document shows how to write overlays. For the rules on choosing and stacking overlays, see I1 in [`../ui-guidelines.md`](../ui-guidelines.md); for the form itself, see [`form.md`](form.md); for how to load data, see [`api.md`](api.md).

## 1. Choosing an overlay

| Use case                                                                             | Component                      | Width (`className`)                                          | Where the open state lives |
| ------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------ | -------------------------- |
| Confirm one action (delete, deactivate, etc.)                                        | `AlertDialog`                  | the default                                                  | Component state            |
| Create or edit with 1–4 fields                                                       | `RouteDialog` (child route)    | `sm:max-w-md`                                                | URL                        |
| A small form that is not a record's create or edit (rename, set one value)           | `Dialog`                       | `sm:max-w-md`                                                | Component state            |
| Create or edit with 5–8 fields, or with a list or a picker                           | `RouteDialog` (child route)    | `sm:max-w-2xl` (the default)                                 | URL                        |
| Record detail view, inspector, a record's edit while the list stays in view          | `RouteDrawer` (child route)    | `sm:max-w-xl` (the default), `sm:max-w-2xl` for a wide table | URL                        |
| Large read-only content (a transcript, a diff, a file preview)                       | `Dialog`                       | `sm:max-w-4xl`, scrolling body                               | Component state            |
| Child page that covers the content area (non-modal), or a form of more than 8 fields | `RouteChildPage` (child route) | —                                                            | URL                        |
| Temporary panel that represents no record or location (explanations, help)           | `Sheet`                        | the default, or I11's width for a form                       | Component state            |

- **Build dialogs and drawers that represent a page, form, editor or detail view as child routes by default**, even when the user does not mention "routing": a link opens them directly, a refresh restores them, and browser back and forward work. Follow an explicit user request for a different interaction.
- For these overlays, do not use an `open` state inside the component, do not add an `open` prop to `RouteDialog`/`RouteDrawer`, and do not build a separate route-overlay implementation. Route matching decides whether the overlay exists: the child route's URL opens it, and the parent route's URL closes it.
- **An overlay opens over the view the user is on** (guideline I9): the page, or on a page with tabs, the tab being shown. A record shown on a dashboard, a board or another record's tab opens the same drawer as in its list, declared under that page ([section 2.1](#21-declare-the-child-routes)). Never link to the list's overlay URL from another page, and never open a page's header overlay beside its tabs (["Overlays opened from the header of a page with tabs" in `child-routes.md`](child-routes.md#overlays-opened-from-the-header-of-a-page-with-tabs)).
- Only a confirmation of a single action (`AlertDialog`), a small form or large read-only content that represents no record (`Dialog`, [section 6](#6-plain-dialogs-sizes-and-scrolling)) and a temporary panel (`Sheet`) use component state. Every confirmation is an `AlertDialog`, never a `Dialog` with two buttons.
- `RouteChildPage` covers the content area and is not modal, so the sidebar and header stay usable; see [`child-routes.md`](child-routes.md).
- Stacking: a drawer can open dialogs and confirmation dialogs on top of it; a dialog can open only a confirmation dialog on top of it. Esc and clicking the backdrop close only the topmost layer (guideline I1).
- This table replaces the overlay table of the shadcn skill, which gives record details to `Sheet` ([section 3 of `shadcn.md`](shadcn.md#3-where-this-application-departs-from-the-skill)).

Component locations: `#components/route-dialog`, `#components/route-drawer`, `#components/use-route-overlay`, `#components/ui/alert-dialog`, `#components/ui/sheet`. The last two are not in the template; add them with `yes n | pnpm exec shadcn add alert-dialog sheet` ([section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

## 2. Overlays as child routes

Work in this order:

1. Declare the child routes in `client/routes.ts`.
2. Place `<Outlet />` in the parent page and pass the refresh function down through `context`.
3. In the child route's page, wrap the content in `RouteDialog` or `RouteDrawer`.
4. Close the overlay by calling `useRouteOverlay()` in a component inside it.
5. When closing needs a check first (a submission in progress, unsaved changes), add `beforeClose`.

### 2.1 Declare the child routes

The projects route with its overlay children is declared in [section 1 of `page.md`](page.md#1-declare-the-route): `new` (`/projects/new`, the create dialog), `edit/:projectId` (`/projects/edit/12`, the edit dialog opened from a row's menu), `:projectId` (`/projects/12`, the detail drawer) and, inside it, `edit` (`/projects/12/edit`, the same edit dialog opened from the drawer). Static segments such as `new` and `edit` take precedence over `:projectId`.

- Declare them in `defineAppRoutes()` in `client/routes.ts`, not in a page component file.
- **An overlay is a child route of the view it opens over, and closing returns to that view.** Create and detail are children of the list route. Edit is declared twice, with the same module: under the list as `edit/:projectId`, so a row's menu opens the dialog alone and closing returns to the list; and under the detail drawer as `edit`, so the drawer's "Edit" stacks the dialog on the drawer and closing returns to the drawer. The two cannot both be `:projectId/edit`: registration rejects a second route whose path differs only in parameter names. On a page with tabs the view is the tab being shown, so an overlay the page's header opens — the edit dialog of a customer's page — is declared under every tab with the same module, stacks on the tab, and closing returns to that tab (["Overlays opened from the header of a page with tabs" in `child-routes.md`](child-routes.md#overlays-opened-from-the-header-of-a-page-with-tabs)).
- Child routes declare no `navigation` (they are not menu items, and a dynamic path cannot be one anyway) and no `breadcrumb` (an overlay is not a destination).
- Child routes follow the `authz` inheritance rules in [section 4 of `page.md`](page.md#4-authz-page-authorization); the parent route's check always applies first.
- Lay out files by what they show, not by every URL that reaches them: `new.tsx`, `detail/index.tsx` and `detail/edit.tsx`, which both edit routes load (see [`child-routes.md`](child-routes.md)).

#### The same drawer over another page

A page that shows records whose details a drawer already presents — a dashboard's recent projects, a board's cards, a customer's projects tab — opens that drawer over itself. It declares the drawer and its edit dialog under its own route, with the same modules, and renders an `Outlet` with the drawer's context ([section 2.2](#22-place-the-outlet-in-the-parent-page)). `projectDetailRoutes` in `client/routes.ts` declares the pair, so each page adds one line; its `owner` argument keeps the route names unique:

```ts
const appRoutes: AppClientRouteContribution = defineAppRoutes([
  // … existing routes, and the projects route of page.md, which calls projectDetailRoutes('project')
  {
    name: 'project-dashboard',
    path: '/project-dashboard',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'navigation.projectDashboard', icon: LayoutDashboard },
    componentLoader: () => import('./pages/project-dashboard/index.js'),
    // /project-dashboard/12 and /project-dashboard/12/edit: the project drawer, over the dashboard
    children: projectDetailRoutes('project-dashboard'),
  },
]);
```

- The page links to a record with a relative path, `{ pathname: project.id, search: location.search }`, as the list does; the drawer's own "Edit" link, `edit`, then resolves under this page as well.
- Do not link to `/projects/12` instead: the list replaces the page the user was on, the menu highlight moves to Projects, and closing the drawer leaves them on the list.
- The drawer's route inherits the page's `authz`. When opening a project must require the projects page's grant rather than this page's, declare it on the drawer's route in the function, as `{ resource: { type: 'page', id: 'projects' }, action: 'access' }`.
- The new route names join the route test's grant list ([section 12 of `page.md`](page.md#12-update-the-route-test)).
- [`example/project-dashboard.md`](example/project-dashboard.md) is the complete page that does this.
- A detail that needs a page rather than a drawer follows the same rule: declare the page module under this page as a covering child route and link to it relatively — ["The same detail page over another page" in `child-routes.md`](child-routes.md#the-same-detail-page-over-another-page).

### 2.2 Place the Outlet in the parent page

`RouteDialog` and `RouteDrawer` do not insert `<Outlet />` automatically. A page that declares `children` must place it itself; the child routes render there.

An overlay reads its context from whichever view it opens over, so every such view passes the same context. The overlays declare what they read in `types.ts` ([`example/types.md`](example/types.md)):

| Context                    | Fields                  | Read by                                 | Passed by                                          |
| -------------------------- | ----------------------- | --------------------------------------- | -------------------------------------------------- |
| `ProjectsOutletContext`    | `reload`, `afterDelete` | The create dialog and the detail drawer | The list, and every other page that opens a drawer |
| `ProjectEditOutletContext` | `onSaved`, `onNotFound` | The edit dialog                         | The detail drawer, and the list for a row's menu   |

The list opens all three overlays, so its context carries both sets of fields. It builds the context with `useMemo` and places `<Outlet context={outletContext} />` at the end of its `PageContainer`; the code is the list page, [`example/list-page.md`](example/list-page.md) (`outletContext`, and the `focusSearchAfterReloadRef` effect behind `afterDelete`), explained in [section 9 of `table.md`](table.md#9-child-routes-and-refreshing-the-list).

- Closing an overlay does not reload the parent page: the parent stays mounted, and its form contents and scroll position are kept. When the parent page's data needs refreshing, the child route calls a function from the context.
- Keep the context stable with `useMemo`: the child route's loading effect lists the context functions as dependencies, so an object that changes on every render causes repeated requests.
- A child route reads it with `useOutletContext<ProjectsOutletContext>()`. It gets the context of the nearest `<Outlet>` above it: the drawer gets the list's or the dashboard's, and the edit dialog gets the drawer's, or the list's when a row's menu opened it.
- On a page with tabs, the overlays the header opens render through the tab's `Outlet`, so each tab places one and passes on the page's context, which it reads with `useOutletContext()` ([`example/detail-page-tabs.md`](example/detail-page-tabs.md)). A tab whose own children need more adds their fields to the same object.
- When an overlay has child routes of its own, place another `<Outlet />` inside the overlay. Placed in `children`, the child route stacks on this overlay, and focus returns to this layer after it closes; placed outside the overlay, the child route opens as a separate layer, which is rarely needed.
- A link that opens an overlay must keep the query parameters: `<Link to={{ pathname: row.original.id, search: location.search }}>`. The list's search and filters live in the URL; if the query parameters are lost, the list behind the overlay changes with them.

### 2.3 Render with RouteDialog or RouteDrawer

- `RouteDialog`: focused tasks such as create, edit and short forms.
- `RouteDrawer`: content that suits the side of the screen, such as detail views and inspectors.

Both take the same props:

| Prop          | Type                                | Description                                                                                                                                                                                      |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`       | `ReactNode`, required               | Title at the top, which is also the overlay's accessible name                                                                                                                                    |
| `description` | `ReactNode`                         | Description under the title                                                                                                                                                                      |
| `children`    | `ReactNode`                         | Content area; scrolls internally when its content exceeds the height                                                                                                                             |
| `footer`      | `ReactNode`                         | Fixed bottom area with the layout `flex flex-wrap justify-end gap-2`: the buttons sit together on the right and wrap on narrow screens                                                           |
| `closeTo`     | `To`                                | Where to go after closing. Defaults to the parent route `{ pathname: '..', search: location.search, hash: '' }`, resolved by route hierarchy, keeping the query parameters and dropping the hash |
| `beforeClose` | `() => boolean \| Promise<boolean>` | Called before closing; returning `false` keeps the overlay open                                                                                                                                  |
| `className`   | `string`                            | Added to the panel to adjust its width: dialogs default to `sm:max-w-2xl`, drawers to `sm:max-w-xl`; a create or edit dialog of 1–4 fields passes `sm:max-w-md` (guideline I1)                   |

What the components already do:

- **Size**: a dialog is centered, is the screen width minus 2rem wide on narrow screens, and has a maximum height of `100dvh - 2rem`; a drawer sits against the right edge at full height and takes the full width on narrow screens. The title area and the bottom button area are fixed and only the content area scrolls, so the bottom buttons stay reachable on narrow screens too (guideline A4); there is no need to add `max-h` or `overflow` to the panel.
- **Content container**: the content area already has `p-4` padding. Do not nest a `PageContainer` inside it, and do not add outer padding of your own.
- **Ways to close**: a close button is built into the top-right corner (its accessible name comes from `routeOverlay.close`); Esc and clicking the backdrop close the overlay too. Each overlay layer has its own backdrop, and when layers stack only the topmost one closes.
- **Closing is navigation**: closing first calls `beforeClose`, then navigates to `closeTo` with `replace`. Because it uses `replace`, pressing the browser's "Forward" after closing does not reopen the overlay.
- **Focus**: on open, focus moves into the overlay; when the focused element inside the overlay disappears (for example, a button is replaced by a skeleton after clicking "Retry"), focus returns to the overlay panel; after closing, focus returns to the element that had focus before opening (usually the link that opened it; for a row menu's "Edit", the menu's trigger). When a nested overlay closes, focus returns to the element in the parent layer that opened it, or to the parent layer's panel if that element is gone; when `/projects/12/edit` is opened directly, both layers mount at once, and after the dialog closes, focus is on the drawer panel.
- When the element that focus should return to is no longer on the page after closing (for example, the list row disappears after a delete), the component cannot handle it. Move focus to a stable place yourself; see `afterDelete` above (guideline A6).

### 2.4 Close with useRouteOverlay

`useRouteOverlay()` returns `{ close, isClosing }`:

- `close(): Promise<void>`: closes the current overlay layer. Calling it again while a close is in progress returns the same Promise.
- `isClosing`: `true` from the `close()` call until navigation finishes (including the wait for `beforeClose`); use it to disable buttons such as "Cancel".

**Call it only in a component inside the overlay**, including a component passed as `footer`. The context comes from `RouteDialog`/`RouteDrawer`, and the page component that renders the overlay is outside it:

```tsx
// Wrong: NewProjectPage renders the RouteDialog, so it is itself outside that RouteDialog.
export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  // Throws when there is no overlay outside; when another overlay is outside, it gets that outer close and closes the wrong layer.
  const { close } = useRouteOverlay();
  return (
    <RouteDialog
      title={t('projects.create.title')}
      footer={
        <Button variant='outline' onClick={() => void close()}>
          {t('actions.cancel')}
        </Button>
      }
    >
      {/* … */}
    </RouteDialog>
  );
}
```

- With no overlay outside, it throws `useRouteOverlay must be used inside RouteDialog or RouteDrawer`. When nested, it does not throw; instead it silently gets the parent overlay's `close` and closes the wrong layer. Context is looked up through the parent-child relationships of React components, regardless of the source file or the DOM location a portal renders into.
- The right way: the page component only renders `RouteDialog`; split the parts that need to close into separate components (for example, `NewProjectBody` and `NewProjectFooter`) and render them as JSX (`<NewProjectFooter />`, not the function call `NewProjectFooter()`; otherwise the hook does not run inside the overlay).
- By default, closing goes to the parent route and keeps the query parameters. Pass `closeTo` only when going somewhere else. It is not how an overlay returns to the view it opened from: that view is its parent route, and an overlay that needs `closeTo`, `location.state` or a query parameter to get back there is declared under the wrong route (["Overlays opened from the header of a page with tabs" in `child-routes.md`](child-routes.md#overlays-opened-from-the-header-of-a-page-with-tabs)). The one reason to pass it on the way back is an overlay that writes parameters of its own, such as a drawer with a search box: it closes to `{ pathname: '..', search: withoutParams(location.search, [...]) }` with those parameters listed, as a page does ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)). Do not close with `navigate(-1)`: a child route opened directly may have no previous history entry.
- When `beforeClose` throws, `close()` rejects and the overlay stays open. When `beforeClose` can throw (for example, it sends a request), the caller must handle it: `close().catch((error: unknown) => { console.error('Failed to close route overlay', error); })`. When `beforeClose` cannot throw, `void close()` is enough.

### 2.5 beforeClose: checks before closing

- `beforeClose` applies to the top-right button, Esc, clicking the backdrop and `close()`; **browser back and forward do not go through it**.
- Returning `false` (or a Promise that resolves to `false`) keeps the overlay open.

**No closing while submitting** (guideline T3.5): write `beforeClose={() => !submittingRef.current}`, using both a state and a ref:

- The state (`submitting`) renders the buttons' disabled and loading states; the ref (`submittingRef`) is what `beforeClose` reads. Both are updated together in the same `handleSubmittingChange` (see `new.tsx`, [`example/create-dialog.md`](example/create-dialog.md)).
- Using only the state, as `() => !submitting`, is unreliable: state updates only on the next render, so a `close()` called right after a successful save may run the `beforeClose` from the "submitting" render, read `submitting === true`, and have the close blocked.
- On success, `ProjectForm` guarantees that it passes `onSubmittingChange(false)` before calling `onSubmitted`, so calling `close()` directly in `onSubmitted` closes the overlay.

**Confirm when there are unsaved changes** (guideline T3.9; recommended for forms with many fields): have `beforeClose` return a Promise, and resolve it after the user chooses in a confirmation dialog. Put the confirmation dialog inside the overlay:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useCallback, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';

import { ProjectForm } from '../project-form.js';
import type { ProjectEditOutletContext } from '../types.js';

export default function EditProjectPage(): ReactElement {
  const { t } = useTranslation();
  const submittingRef = useRef(false);
  // Whether there are unsaved changes: the form reports it through onDirtyChange. The callback is stable, so the
  // form's report effect does not run again when this page re-renders (a save updates the view behind it), which
  // would write the just-saved form's still-dirty state back into the ref.
  const dirtyRef = useRef(false);
  const handleDirtyChange = useCallback((dirty: boolean): void => {
    dirtyRef.current = dirty;
  }, []);
  // While asking "Discard changes?", holds the function that answers beforeClose.
  const [discardPrompt, setDiscardPrompt] = useState<{
    readonly answer: (discard: boolean) => void;
  }>();

  function answerDiscard(discard: boolean): void {
    discardPrompt?.answer(discard);
    setDiscardPrompt(undefined);
  }

  return (
    <RouteDialog
      title={t('projects.edit.title')}
      beforeClose={() => {
        if (submittingRef.current) return false;
        if (!dirtyRef.current) return true;
        // Return a Promise: whether to close is decided only after the user chooses in the confirmation dialog.
        return new Promise<boolean>((resolve) => {
          setDiscardPrompt({ answer: resolve });
        });
      }}
    >
      {/* The form's body (`EditProjectBody` below) extends `detail/edit.tsx` in example/edit-dialog.md with the
          dirty reporting this pattern needs. */}
      <EditProjectBody onDirtyChange={handleDirtyChange} />
      {/* The confirmation dialog sits inside the dialog, so Esc closes only the confirmation dialog. */}
      <AlertDialog
        open={discardPrompt !== undefined}
        onOpenChange={(open) => {
          // Esc or "Keep editing": the dialog stays open. An AlertDialog ignores backdrop clicks.
          if (!open) answerDiscard(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.discard.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.discard.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('projects.discard.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => answerDiscard(true)}
            >
              {t('projects.discard.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDialog>
  );
}

/** The form's body: it reports unsaved changes, and the success path clears the flag before closing. */
function EditProjectBody({
  onDirtyChange,
}: {
  readonly onDirtyChange: (dirty: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { onSaved } = useOutletContext<ProjectEditOutletContext>();
  return (
    <ProjectForm
      formId='project-edit-form'
      // … project, onSubmittingChange and onNotFound as in example/edit-dialog.md
      onDirtyChange={onDirtyChange}
      onSubmitted={(saved) => {
        // The save succeeded, so no unsaved changes remain: clear the flag before closing, or beforeClose would ask
        // to discard the changes that were just saved.
        onDirtyChange(false);
        onSaved(saved);
        void close();
      }}
    />
  );
}
```

- **After a successful save, set `dirtyRef.current` back to `false` before calling `close()`**; otherwise the close after saving also brings up the "Discard changes?" prompt.
- `isClosing` is `true` while waiting for the user's choice.
- Browser back does not go through `beforeClose`, so in that case the changes are lost.

## 3. Complete example

The create dialog, the detail drawer and the edit dialog built with these rules are [`example/create-dialog.md`](example/create-dialog.md), [`example/detail-drawer.md`](example/detail-drawer.md) and [`example/edit-dialog.md`](example/edit-dialog.md) (`new.tsx`, `detail/index.tsx`, `detail/edit.tsx`), each with notes on the choices it makes; the form they share is [`example/project-form.md`](example/project-form.md). The dashboard, [`example/project-dashboard.md`](example/project-dashboard.md), opens the same drawer over another page. Read them before writing an overlay of your own.

## 4. Delete confirmation (AlertDialog)

A confirmation dialog concerns a single action, so it uses component state. Make it one component, `project-delete-dialog.tsx` ([`example/delete-dialog.md`](example/delete-dialog.md)), shared by the list's row menu and the detail drawer. The list page keeps `deletion` state (`{ open, project }`), sets it from the row menu's "Delete" and renders `<ProjectDeleteDialog … deletedFocusRef={searchRef} />` ([`example/list-page.md`](example/list-page.md)); the drawer renders it from `ProjectDetailActions` ([`example/detail-drawer.md`](example/detail-drawer.md)).

- **Store the open state and the target separately**: closing only sets `open` to `false` and keeps `project`. If closing also clears the target, the title flashes to an empty name during the exit animation.
- **Title and buttons**: the title names the record, the description states the consequence, and the confirm button uses the destructive style and the specific action "Delete" (guidelines I2 and C7).
- `AlertDialogAction` does not close the confirmation dialog automatically: on success, the parent closes it in `onDeleted` (the list sets `open` to `false`; the drawer closes the whole drawer). `AlertDialogCancel` does close automatically.
- **While deleting**: `onOpenChange` ignores close requests (Esc; an AlertDialog ignores backdrop clicks anyway), both buttons are disabled, and the confirm button shows a `Spinner` (guideline S5).
- **Failure**: the confirmation dialog stays open and explains the reason inside it with `role='alert'` (guideline I3), by status as ["Handling each kind of error" in `api.md`](api.md#handling-each-kind-of-error) says; the confirm button stays enabled only for a failure a retry can fix.
- **404**: someone else already deleted the record; say so with an `info` toast and treat it as a successful delete (guideline R3).
- **Where focus goes**: the deleted row disappears together with the menu that opened the confirmation dialog, so the list passes `deletedFocusRef={searchRef}`, and focus lands on the search box after the delete (guideline A6). The drawer does not pass it: the drawer closes, and the list's `afterDelete` handles focus.
- When the confirmation dialog renders inside the drawer (in the drawer's `footer`), Esc closes only the confirmation dialog.

## 5. Sheet: temporary panels

Use `Sheet` for side panels that do not represent a record or a location and need no direct link (explanations, help and so on), and keep the open state in the component. Use `RouteDrawer` for record details, not `Sheet`. The template does not ship it: add it with `yes n | pnpm exec shadcn add sheet`.

```tsx
// client/pages/projects/status-help-sheet.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { InfoIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#components/ui/sheet';

import { PROJECT_STATUSES } from './types.js';

/** A temporary explanation panel: it represents no record or location, so it does not go into the URL. */
export function ProjectStatusHelp(): ReactElement {
  const { t } = useTranslation();
  return (
    <Sheet>
      <SheetTrigger render={<Button variant='outline' />}>
        <InfoIcon data-icon='inline-start' />
        {t('projects.statusHelp.action')}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('projects.statusHelp.title')}</SheetTitle>
          <SheetDescription>
            {t('projects.statusHelp.description')}
          </SheetDescription>
        </SheetHeader>
        {/* SheetContent does not scroll by itself: the content area fills the remaining height and scrolls on its own. */}
        <dl className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4'>
          {PROJECT_STATUSES.map((status) => (
            <div key={status} className='flex flex-col gap-1'>
              <dt className='font-medium'>{t(`projects.status.${status}`)}</dt>
              <dd className='text-muted-foreground'>
                {t(`projects.statusHelp.${status}`)}
              </dd>
            </div>
          ))}
        </dl>
        <SheetFooter>
          <SheetClose render={<Button variant='outline' />}>
            {t('actions.close')}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

The details below describe `sheet.tsx` as the registry writes it today; the file the CLI wrote is the authority when they differ.

- Use `SheetTrigger render={<Button />}` for the trigger button and `SheetClose render={<Button />}` for the close button. To control opening and closing from code, pass `open` and `onOpenChange` to `Sheet`.
- `side` defaults to `'right'`; the other options are `'left'`, `'top'` and `'bottom'`. On the left and right sides the width is `w-3/4 sm:max-w-sm`, narrow enough only for a small panel like this one; a sheet holding a form or a record's details is medium width (guideline I11). Widen it with the side's prefix, `className='w-full data-[side=right]:sm:max-w-xl'`: the registry writes the default as `data-[side=right]:sm:max-w-sm`, and a bare `sm:max-w-xl` loses to it, so the sheet stays narrow.
- `SheetContent` is a vertical flex container and does not scroll itself: give the content area `min-h-0 flex-1 overflow-y-auto`. `SheetFooter` sits at the bottom, with its buttons stacked vertically.
- `SheetContent` has a built-in close button in the top-right corner (turn it off with `showCloseButton={false}`). The registry names it with the English "Close"; when you add `sheet`, replace that literal with `{t('actions.close')}` as ["English built into primitives" in `shadcn.md`](shadcn.md#english-built-into-primitives) shows.

## 6. Plain dialogs: sizes and scrolling

A `Dialog` from `#components/ui/dialog` defaults to `sm:max-w-sm` and grows with its content without limit. Give it the width guideline I1 assigns to what it holds, and when its content can outgrow the screen, cap its height with the one idiom `max-h-[calc(100dvh-2rem)]` and scroll only its body, so the header and the footer's buttons stay in view (guideline A4):

```tsx
// A small form: 1–4 fields, the width alone.
<DialogContent className='sm:max-w-md'>…</DialogContent>

// Content that can outgrow the screen: a fixed header and footer around a scrolling body.
<DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
  <DialogHeader>…</DialogHeader>
  <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4'>…</div>
  <DialogFooter>…</DialogFooter>
</DialogContent>
```

- `flex flex-col` replaces the content's grid, and `min-h-0 flex-1` lets the body shrink and scroll; `-mx-4 … px-4` runs its scrollbar along the dialog's edge. When the body is the form, put the classes on the `form` and keep the submit button in `DialogFooter` with `form='…'`.
- Do not cap the height any other way (`90vh`, `85dvh`, `calc(100svh-2rem)`, `min(40rem,…)`), and do not put `overflow-y-auto` on `DialogContent` itself: the footer would scroll away with the content.
- Large read-only content (a transcript, a diff, a file preview) uses the same structure at `sm:max-w-4xl`, usually with no footer.
- `RouteDialog` and `RouteDrawer` are built this way already; pass them only a width.

## 7. Verification checklist

After implementing, confirm each item by actually trying it:

- [ ] Overlays such as create, edit and detail views are all child routes; only confirmation dialogs and temporary panels use component state.
- [ ] A row menu's "Edit" opens the dialog alone; the drawer's "Edit" stacks it on the drawer; on a page with tabs, the header's "Edit" stacks it on the tab being shown. A record opened from any other page opens over that page, and closing stays there.
- [ ] From a view other than the first one a page shows — a tab other than the default, a list with a search or filter applied — every overlay's URL is that view's URL plus its own segments, the view stays rendered behind it, and closing, saving, Esc and Back all return to exactly that URL.
- [ ] The parent page places `<Outlet />` in the intended spot; an overlay with child routes also places `<Outlet />` inside itself.
- [ ] The right one of `RouteDialog` / `RouteDrawer` is chosen, with the width guideline I1 gives what it holds; child routes declare no `navigation` or `breadcrumb`.
- [ ] Every confirmation is an `AlertDialog`; a plain `Dialog` has I1's width, and one that can outgrow the screen caps its height at `calc(100dvh-2rem)` with a scrolling body and its footer in view.
- [ ] `useRouteOverlay()` is called in components inside the overlay, not in the page component that renders the overlay; when `beforeClose` can throw, the rejection from `close()` is handled.
- [ ] While submitting or deleting, ×, Esc, clicking the backdrop (dialogs and drawers; an AlertDialog never closes on it) and "Cancel" all fail to close it; where needed, there is a confirmation for unsaved changes.
- [ ] Opening a child route's URL directly (with the deployment base path, for example `/main/projects/12/edit`, `/main/projects/edit/12` and `/main/customers/12/orders/edit`), refreshing, browser back and forward, and nested overlays all show the correct layers.
- [ ] Opening and closing overlays keeps the query parameters, so the search and filters of the list behind stay the same: after closing, the URL is exactly the one the overlay was opened from, with nothing the overlay wrote left in it. The parent page stays mounted and does not reload.
- [ ] After saving, the drawer shows the new values immediately, and the list refreshes afterwards (guideline R2).
- [ ] Record not found: the situation is explained, no "Retry" is offered, and the list refreshes (guideline R3); other load failures can be retried (guideline S4).
- [ ] Delete: failures are explained in the confirmation dialog, a 404 is treated as success, and focus lands on the search box after the delete (guideline A6).
- [ ] Esc closes only the topmost layer; after closing, focus returns to the element that opened it, or lands in a stable place when that element is gone.
- [ ] At a width of 375px, overlays stay within the screen, the content area scrolls, and the bottom buttons are reachable (guideline A4).
- [ ] Without permission for the parent route, the child route's URL does not open either.
- [ ] The new route names are in the route test's page grant list (see [section 12 of `page.md`](page.md#12-update-the-route-test)).
