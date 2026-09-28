# Dialogs, drawers and confirmation dialogs

This document shows how to write overlays. For the rules on choosing and stacking overlays, see I1 in `../ui-guidelines.md`; for the form itself, see `form.md`; for how to load data, see `api.md`.

## 1. Choosing an overlay

| Use case                                                                   | Component                      | Where the open state lives |
| -------------------------------------------------------------------------- | ------------------------------ | -------------------------- |
| Create, edit (short form)                                                  | `RouteDialog` (child route)    | URL                        |
| Record detail view, inspector                                              | `RouteDrawer` (child route)    | URL                        |
| Child page that covers the content area (non-modal)                        | `RouteChildPage` (child route) | URL                        |
| Confirm one action (delete, deactivate, etc.)                              | `AlertDialog`                  | Component state            |
| Temporary panel that represents no record or location (explanations, help) | `Sheet`                        | Component state            |

- **Build dialogs and drawers that represent a page, form, editor or detail view as child routes by default**, even when the user does not mention "routing": a link opens them directly, a refresh restores them, and browser back and forward work. Follow an explicit user request for a different interaction.
- For these overlays, do not use an `open` state inside the component, do not add an `open` prop to `RouteDialog`/`RouteDrawer`, and do not build a separate route-overlay implementation. Route matching decides whether the overlay exists: the child route's URL opens it, and the parent route's URL closes it.
- Only a confirmation of a single action (`AlertDialog`) and a temporary panel (`Sheet`) use component state.
- `RouteChildPage` covers the content area and is not modal, so the sidebar and header stay usable; see `child-routes.md`.
- Stacking: a drawer can open dialogs and confirmation dialogs on top of it; a dialog can open only a confirmation dialog on top of it. Esc and clicking the backdrop close only the topmost layer (guideline I1).

Component locations: `@/components/route-dialog`, `@/components/route-drawer`, `@/components/use-route-overlay`, `@/components/ui/alert-dialog`, `@/components/ui/sheet`.

## 2. Overlays as child routes

Work in this order:

1. Declare the child routes in `client/routes.ts`.
2. Place `<Outlet />` in the parent page and pass the refresh function down through `context`.
3. In the child route's page, wrap the content in `RouteDialog` or `RouteDrawer`.
4. Close the overlay by calling `useRouteOverlay()` in a component inside it.
5. When closing needs a check first (a submission in progress, unsaved changes), add `beforeClose`.

### 2.1 Declare the child routes

```ts
// client/routes.ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { FolderKanban } from 'lucide-react';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  // … existing routes (home, sign-in pages); keep them
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'navigation.projects', icon: FolderKanban },
    componentLoader: () => import('./pages/projects/index.js'),
    // Declare overlays as child routes of "the page that stays underneath them"; no navigation or breadcrumb.
    children: [
      {
        // /projects/new: the create dialog. The static segment new takes precedence over :projectId.
        name: 'project-new',
        path: 'new',
        authz: 'skip',
        componentLoader: () => import('./pages/projects/new.js'),
      },
      {
        // /projects/:projectId: the detail drawer
        name: 'project-detail',
        path: ':projectId',
        authz: 'skip',
        componentLoader: () => import('./pages/projects/detail/index.js'),
        children: [
          {
            // /projects/:projectId/edit: the edit dialog, stacked on the detail drawer
            name: 'project-edit',
            path: 'edit',
            authz: 'skip',
            componentLoader: () => import('./pages/projects/detail/edit.js'),
          },
        ],
      },
    ],
  },
]);
// …
```

- Declare them in `defineAppRoutes()` in `client/routes.ts`, not in a page component file.
- An overlay is a child route of "the page to return to after closing": create and detail are children of the list route; edit is a child of the detail route, so the edit dialog stacks on the drawer and closing it returns to the drawer.
- Child routes declare no `navigation` (they are not menu items, and a dynamic path cannot be one anyway) and no `breadcrumb` (an overlay is not a destination).
- A child route inherits `authz` from its parent page when it omits it; `'skip'` adds no check of its own, and the parent route's check still applies. Endpoints enforce permissions themselves (see `page.md`).
- Lay out files by path segment: `new.tsx`, `detail/index.tsx`, `detail/edit.tsx` (see `child-routes.md`). After adding routes, add their names to the page grant list in the route test (see section 12 of `page.md`).

### 2.2 Place the Outlet in the parent page

`RouteDialog` and `RouteDrawer` do not insert `<Outlet />` automatically. A page that declares `children` must place it itself; the child routes render there.

First write the types for the two levels of context in `types.ts`:

```ts
// client/pages/projects/types.ts
// … PROJECT_STATUSES, ProjectStatus, Project

/** What the list page passes to its child routes (create dialog, detail drawer) through `<Outlet context>`. */
export interface ProjectsOutletContext {
  /** Refreshes the list in the background. */
  readonly reload: () => void;
  /** Called after the detail drawer deletes the record: refreshes the list, then moves focus to the search box. */
  readonly afterDelete: () => void;
}

/** What the detail drawer passes to the edit dialog through `<Outlet context>`. */
export interface ProjectDetailOutletContext {
  /** Called after a successful save: updates the drawer with the record the endpoint returned and refreshes the list (guideline R2). */
  readonly onSaved: (project: Project) => void;
  /** Called on finding that the record no longer exists: the drawer switches to "not found" and the list refreshes (guideline R3). */
  readonly onNotFound: () => void;
}
```

The list page places `<Outlet context>` at the end of `PageContainer` (for the complete list page, see `table.md`):

```tsx
// client/pages/projects/index.tsx
export default function ProjectsPage(): ReactElement {
  // … (load the list to get loading and the refresh function reload; searchRef points to the search box)

  // After a record is deleted in the drawer, its row and the link that opened the drawer disappear once the list refreshes:
  // wait for the refresh to finish before moving focus to the search box (guideline A6).
  const focusSearchAfterReloadRef = useRef(false);
  useEffect(() => {
    if (loading || !focusSearchAfterReloadRef.current) return;
    focusSearchAfterReloadRef.current = false;
    searchRef.current?.focus();
  }, [loading]);

  // Keep the context passed to child routes stable; otherwise effects in the child routes that depend on it run again and again.
  const outletContext = useMemo<ProjectsOutletContext>(
    () => ({
      reload,
      afterDelete: () => {
        focusSearchAfterReloadRef.current = true;
        reload();
      },
    }),
    [reload],
  );

  // …

  return (
    <PageContainer>
      {/* … page header, toolbar, table, delete confirmation dialog */}
      {/* The create and detail child routes render here and get the list refresh function through context. */}
      <Outlet context={outletContext} />
    </PageContainer>
  );
}
```

- Closing an overlay does not reload the parent page: the parent stays mounted, and its form contents and scroll position are kept. When the parent page's data needs refreshing, the child route calls a function from the context.
- Keep the context stable with `useMemo`: the child route's loading effect lists the context functions as dependencies, so an object that changes on every render causes repeated requests.
- A child route reads it with `useOutletContext<ProjectsOutletContext>()`. It gets the context of the nearest `<Outlet>` above it: the drawer gets the list's, and the edit dialog gets the drawer's.
- When an overlay has child routes of its own, place another `<Outlet />` inside the overlay. Placed in `children`, the child route stacks on this overlay, and focus returns to this layer after it closes; placed outside the overlay, the child route opens as a separate layer, which is rarely needed.
- A link that opens an overlay must keep the query parameters: `<Link to={{ pathname: String(row.original.id), search: location.search }}>`. The list's search and filters live in the URL; if the query parameters are lost, the list behind the overlay changes with them.

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
| `className`   | `string`                            | Added to the panel to adjust its width: dialogs default to `sm:max-w-2xl`, drawers to `sm:max-w-xl`                                                                                              |

What the components already do:

- **Size**: a dialog is centered, is the screen width minus 2rem wide on narrow screens, and has a maximum height of `100svh - 2rem`; a drawer sits against the right edge at full height and takes the full width on narrow screens. The title area and the bottom button area are fixed and only the content area scrolls, so the bottom buttons stay reachable on narrow screens too (guideline A4); there is no need to add `max-h` or `overflow` to the panel.
- **Content container**: the content area already has `p-4` padding. Do not nest a `PageContainer` inside it, and do not add outer padding of your own.
- **Ways to close**: a close button is built into the top-right corner (its accessible name comes from `routeOverlay.close`); Esc and clicking the backdrop close the overlay too. Each overlay layer has its own backdrop, and when layers stack only the topmost one closes.
- **Closing is navigation**: closing first calls `beforeClose`, then navigates to `closeTo` with `replace`. Because it uses `replace`, pressing the browser's "Forward" after closing does not reopen the overlay.
- **Focus**: on open, focus moves into the overlay; when the focused element inside the overlay disappears (for example, a button is replaced by a skeleton after clicking "Retry"), focus returns to the overlay panel; after closing, focus returns to the element that had focus before opening (usually the link that opened it). When a nested overlay closes, focus returns to the element in the parent layer that opened it, or to the parent layer's panel if that element is gone; when `/projects/12/edit` is opened directly, both layers mount at once, and after the dialog closes, focus is on the drawer panel.
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
- By default, closing goes to the parent route and keeps the query parameters. Pass `closeTo` only when going somewhere else. Do not close with `navigate(-1)`: a child route opened directly may have no previous history entry.
- When `beforeClose` throws, `close()` rejects and the overlay stays open. When `beforeClose` can throw (for example, it sends a request), the caller must handle it: `close().catch((error: unknown) => { console.error('Failed to close route overlay', error); })`. When `beforeClose` cannot throw, `void close()` is enough.

### 2.5 beforeClose: checks before closing

- `beforeClose` applies to the top-right button, Esc, clicking the backdrop and `close()`; **browser back and forward do not go through it**.
- Returning `false` (or a Promise that resolves to `false`) keeps the overlay open.

**No closing while submitting** (guideline T3.5): write `beforeClose={() => !submittingRef.current}`, using both a state and a ref:

- The state (`submitting`) renders the buttons' disabled and loading states; the ref (`submittingRef`) is what `beforeClose` reads. Both are updated together in the same `handleSubmittingChange` (see `new.tsx` in 3.1).
- Using only the state, as `() => !submitting`, is unreliable: state updates only on the next render, so a `close()` called right after a successful save may run the `beforeClose` from the "submitting" render, read `submitting === true`, and have the close blocked.
- On success, `ProjectForm` guarantees that it passes `onSubmittingChange(false)` before calling `onSubmitted`, so calling `close()` directly in `onSubmitted` closes the overlay.

**Confirm when there are unsaved changes** (guideline T3.9; recommended for forms with many fields): have `beforeClose` return a Promise, and resolve it after the user chooses in a confirmation dialog. Put the confirmation dialog inside the overlay:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';

import { RouteDialog } from '@/components/route-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function EditProjectPage(): ReactElement {
  const { t } = useTranslation();
  const submittingRef = useRef(false);
  // Whether there are unsaved changes: set to true when the form content changes, and back to false after a successful save, before calling close().
  const dirtyRef = useRef(false);
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
      {/* … form */}
      {/* The confirmation dialog sits inside the dialog, so Esc closes only the confirmation dialog. */}
      <AlertDialog
        open={discardPrompt !== undefined}
        onOpenChange={(open) => {
          // Esc, clicking the backdrop, "Keep editing": the dialog stays open.
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
```

- **After a successful save, set `dirtyRef.current` back to `false` before calling `close()`**; otherwise the close after saving also brings up the "Discard changes?" prompt.
- `isClosing` is `true` while waiting for the user's choice.
- Browser back does not go through `beforeClose`, so in that case the changes are lost.

## 3. Complete example

For the routes and file structure, see 2.1. For the example's endpoints and the `Project` type, see `api.md`; for `ProjectForm`, see 3.4; for `ProjectStatusBadge` (`status-badge.tsx`), see `i18n.md`.

### 3.1 Create: `new.tsx`

```tsx
// client/pages/projects/new.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useRouteOverlay } from '@/components/use-route-overlay';

import { ProjectForm } from './project-form.js';
import type { ProjectsOutletContext } from './types.js';

const FORM_ID = 'project-new-form';

export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  // The state disables the buttons; the ref is for beforeClose to read: when close() runs right after a successful save, the new state value has not rendered yet.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean) => {
    submittingRef.current = value;
    setSubmitting(value);
  };

  return (
    <RouteDialog
      title={t('projects.create.title')}
      description={t('projects.form.description')}
      className='sm:max-w-lg'
      // No closing while submitting: the × button, Esc, clicking the backdrop and close() all go through beforeClose first (guideline T3.5).
      beforeClose={() => !submittingRef.current}
      footer={<NewProjectFooter submitting={submitting} />}
    >
      <NewProjectBody onSubmittingChange={handleSubmittingChange} />
    </RouteDialog>
  );
}

// useRouteOverlay() can only be called in a component inside RouteDialog, so the form and the footer buttons each get their own wrapper component.
function NewProjectBody({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<ProjectsOutletContext>();
  return (
    <ProjectForm
      formId={FORM_ID}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}

function NewProjectFooter({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={submitting}
        onClick={() => void close()}
      >
        {t('actions.cancel')}
      </Button>
      {/* The button is outside the <form> and linked through the form attribute; while it is disabled, Enter does not submit either. */}
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : t('actions.create')}
      </Button>
    </>
  );
}
```

- **Form in `children`, buttons in `footer`**: the buttons are outside the `<form>`, so give the `<form>` an `id` and write the submit button as `type='submit' form={FORM_ID}`; pressing Enter in the form still submits. Make `FORM_ID` a module constant; it must be unique on the page.
- **Button order**: "Cancel" on the left and the submit button on the right, grouped at the right edge (`footer` has `justify-end` built in); the submit button names the specific action, "Create" (guidelines T3.4 and C3). While submitting, both buttons are disabled and the submit button shows a `Spinner` (guideline T3.5).
- **Success**: `ProjectForm` shows the success message, so the page must not show a toast as well. The page first calls `reload()` to refresh the list behind it, then `close()` (guideline T3.7). After closing, focus returns to the "New project" button.
- The 3-field form narrows the dialog with `className='sm:max-w-lg'`.

### 3.2 Detail view: `detail/index.tsx`

```tsx
// client/pages/projects/detail/index.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';

import { RouteDrawer } from '@/components/route-drawer';
import { useRouteOverlay } from '@/components/use-route-overlay';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ProjectDeleteDialog } from '../project-delete-dialog.js';
import { ProjectStatusBadge } from '../status-badge.js';
import type {
  Project,
  ProjectDetailOutletContext,
  ProjectsOutletContext,
} from '../types.js';

/** Route `/projects/:projectId`: the project detail drawer. */
export default function ProjectDetailPage(): ReactElement {
  const { projectId = '' } = useParams();
  // Key by id: when forward or back switches to another record, the drawer's state starts over.
  return <ProjectDetail key={projectId} projectId={projectId} />;
}

function ProjectDetail({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  // Functions the list page passes down through <Outlet context>.
  const { reload: reloadList, afterDelete } =
    useOutletContext<ProjectsOutletContext>();

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${projectId}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly project?: Project;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    // Abort the request when the parameters change or the component unmounts, so an old result never overwrites a new one.
    const controller = new AbortController();
    const key = `${projectId}:${reloadCount}`;
    api
      .request<{ data: Project }>({
        path: `projects/${encodeURIComponent(projectId)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, project: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          // The record no longer exists: the list behind may still show its row, so refresh the list (guideline R3).
          if (error instanceof ApiClientError && error.status === 404) {
            reloadList();
          }
        },
      );
    return () => controller.abort();
  }, [api, projectId, reloadCount, reloadList]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;

  // After an edit is saved, show the record the endpoint returned right away instead of waiting for a reload (guideline R2).
  const [saved, setSaved] = useState<Project>();
  // The edit dialog found that the record no longer exists.
  const [gone, setGone] = useState(false);

  const notFound = gone || status === 404;
  const project = notFound ? undefined : (saved ?? result?.project);

  // The edit dialog (child route edit) gets these two callbacks through <Outlet context>.
  // Keep them stable with useMemo: the dialog's loading effect depends on them.
  const outletContext = useMemo<ProjectDetailOutletContext>(
    () => ({
      onSaved: (updated) => {
        setSaved(updated);
        reloadList();
      },
      onNotFound: () => {
        setGone(true);
        reloadList();
      },
    }),
    [reloadList],
  );

  let body: ReactElement;
  if (notFound || status === 403) {
    // Record not found or no permission: a retry will not succeed either, so only explain the situation (guidelines R3 and S4).
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound
            ? t('projects.error.notFound')
            : t('projects.error.forbidden')}
        </AlertDescription>
      </Alert>
    );
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('projects.error.requestFailed')}</AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (!project) {
    body = (
      <div role='status' aria-label={t('status.loading')} className='space-y-3'>
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='h-4 w-2/3' />
      </div>
    );
  } else {
    body = <ProjectFields project={project} />;
  }

  return (
    <RouteDrawer
      title={project?.name ?? t('projects.detail.title')}
      // Show no record actions before the record has loaded or when it does not exist.
      footer={
        project ? (
          <ProjectDetailActions project={project} onDeleted={afterDelete} />
        ) : undefined
      }
    >
      {body}
      {/* The edit dialog (child route edit) renders inside the drawer, stacked on it; placed outside the state branches, it is not unmounted when the drawer switches state. */}
      <Outlet context={outletContext} />
    </RouteDrawer>
  );
}

/**
 * Record actions at the bottom of the drawer. The footer renders inside the drawer, so useRouteOverlay() can be called here.
 * The footer is justify-end: the two buttons sit together on the right, and "Edit" is the only primary button in this view (guidelines T2.2 and L2).
 */
function ProjectDetailActions({
  project,
  onDeleted,
}: {
  readonly project: Project;
  readonly onDeleted: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const { close } = useRouteOverlay();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Button variant='destructive' onClick={() => setDeleteOpen(true)}>
        {t('projects.actions.delete')}
      </Button>
      {/* Edit is a child route: the button renders as a link that keeps the query parameters, so the filters of the list behind stay the same. */}
      <Button
        nativeButton={false}
        render={<Link to={{ pathname: 'edit', search: location.search }} />}
      >
        {t('projects.actions.edit')}
      </Button>
      {/* The delete confirmation uses component state. On success, first let the list refresh and arrange focus, then close the drawer. */}
      <ProjectDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        project={project}
        onDeleted={() => {
          onDeleted();
          void close();
        }}
      />
    </>
  );
}

function ProjectFields({
  project,
}: {
  readonly project: Project;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );
  return (
    <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
      <dt className='text-muted-foreground'>{t('projects.fields.owner')}</dt>
      {/* Long text without spaces still wraps instead of widening the drawer. */}
      <dd className='min-w-0 wrap-anywhere'>{project.owner ?? '—'}</dd>
      <dt className='text-muted-foreground'>{t('projects.fields.status')}</dt>
      <dd>
        <ProjectStatusBadge status={project.status} />
      </dd>
      <dt className='text-muted-foreground'>
        {t('projects.fields.updatedAt')}
      </dt>
      <dd>{dateFormat.format(new Date(project.updatedAt))}</dd>
    </dl>
  );
}
```

- **Key by id**: when browser forward or back switches to another record, state such as `saved` and `gone` starts over.
- **States**: while loading, show a skeleton in the "label — value" shape; 404 and 403 only explain the situation and offer no "Retry"; other failures offer "Retry" (guidelines S1 and S4). A 404 also refreshes the list (guideline R3).
- **Record actions in the footer** (guideline T2.2): shown only after the record has loaded. "Delete" and "Edit" sit together on the right, and "Edit" is the only primary button. `ProjectDetailActions` renders inside the drawer as its `footer`, so it can call `useRouteOverlay()` directly.
- **Edit is a link**: `nativeButton={false}` + `render={<Link to={{ pathname: 'edit', search: location.search }} />}` resolves relative to the current route to `/projects/12/edit` and keeps the query parameters.
- **Close the drawer after deleting**: first call the list's `afterDelete` (refreshes the list, then focuses the search box), then `close()`. After the drawer closes, focus first returns to that row's link; when the list refreshes, the row disappears, and `afterDelete` then moves focus to the search box (guideline A6).
- **The edit dialog's Outlet goes inside the drawer, outside the state branches**: the dialog stacks on the drawer, and Esc closes only the dialog; when the drawer switches to "not found", a dialog that is already open is not unmounted along with it.
- **Update immediately after saving**: the edit dialog calls `onSaved`, the drawer updates at once with the record the endpoint returned (`saved`), and then the list behind refreshes (guideline R2).

### 3.3 Edit: `detail/edit.tsx`

```tsx
// client/pages/projects/detail/edit.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { useRouteOverlay } from '@/components/use-route-overlay';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { ProjectForm } from '../project-form.js';
import type { Project, ProjectDetailOutletContext } from '../types.js';

const FORM_ID = 'project-edit-form';

/** Route `/projects/:projectId/edit`: edit a project, stacked on the detail drawer. */
export default function EditProjectPage(): ReactElement {
  const { projectId = '' } = useParams();
  return <EditProject key={projectId} projectId={projectId} />;
}

function EditProject({
  projectId,
}: {
  readonly projectId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  // Callbacks the detail drawer passes down through <Outlet context>.
  const { onNotFound } = useOutletContext<ProjectDetailOutletContext>();

  // The state disables the buttons; the ref is for beforeClose to read: when close() runs right after a successful save, the new state value has not rendered yet.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean) => {
    submittingRef.current = value;
    setSubmitting(value);
  };

  // On open, load the latest data by id before rendering the form, instead of using the drawer's possibly stale data (guidelines T3.8 and R1).
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${projectId}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly project?: Project;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    const key = `${projectId}:${reloadCount}`;
    api
      .request<{ data: Project }>({
        path: `projects/${encodeURIComponent(projectId)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, project: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          // The record no longer exists: tell the drawer to switch to "not found" and refresh the list (guideline R3).
          if (error instanceof ApiClientError && error.status === 404) {
            onNotFound();
          }
        },
      );
    return () => controller.abort();
  }, [api, projectId, reloadCount, onNotFound]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;
  // A 404 on save also means the record does not exist.
  const [goneOnSave, setGoneOnSave] = useState(false);
  const notFound = goneOnSave || status === 404;
  const project = loading ? undefined : result?.project;

  let body: ReactElement;
  let footer: ReactElement;
  if (notFound || status === 403) {
    // Offer no "Retry", only "Close" (guidelines R3 and S4).
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound
            ? t('projects.error.notFound')
            : t('projects.error.forbidden')}
        </AlertDescription>
      </Alert>
    );
    footer = <CloseButton label={t('actions.close')} />;
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('projects.error.requestFailed')}</AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
    footer = <CloseButton label={t('actions.cancel')} />;
  } else if (!project) {
    body = (
      <div
        role='status'
        aria-label={t('status.loading')}
        className='flex flex-col gap-5'
      >
        {['name', 'owner', 'status'].map((field) => (
          <div key={field} className='flex flex-col gap-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-8 w-full' />
          </div>
        ))}
      </div>
    );
    footer = <CloseButton label={t('actions.cancel')} />;
  } else {
    body = (
      <EditProjectBody
        project={project}
        onSubmittingChange={handleSubmittingChange}
        onNotFound={() => {
          setGoneOnSave(true);
          onNotFound();
        }}
      />
    );
    footer = <EditProjectFooter submitting={submitting} />;
  }

  return (
    <RouteDialog
      title={t('projects.edit.title')}
      description={t('projects.form.description')}
      className='sm:max-w-lg'
      // No closing while submitting: the × button, Esc, clicking the backdrop and close() all go through beforeClose first (guideline T3.5).
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDialog>
  );
}

// useRouteOverlay() can only be called in a component inside RouteDialog, so the form and the footer buttons each get their own wrapper component.
function EditProjectBody({
  project,
  onSubmittingChange,
  onNotFound,
}: {
  readonly project: Project;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onNotFound: () => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { onSaved } = useOutletContext<ProjectDetailOutletContext>();
  return (
    <ProjectForm
      formId={FORM_ID}
      project={project}
      onSubmittingChange={onSubmittingChange}
      onNotFound={onNotFound}
      onSubmitted={(saved) => {
        // First update the drawer with the record the endpoint returned and refresh the list, then close the dialog (guideline R2).
        onSaved(saved);
        void close();
      }}
    />
  );
}

function EditProjectFooter({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <CloseButton label={t('actions.cancel')} disabled={submitting} />
      {/* The button is outside the <form> and linked through the form attribute. */}
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : t('actions.save')}
      </Button>
    </>
  );
}

function CloseButton({
  label,
  disabled = false,
}: {
  readonly label: string;
  readonly disabled?: boolean;
}): ReactElement {
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button
      type='button'
      variant='outline'
      disabled={disabled || isClosing}
      onClick={() => void close()}
    >
      {label}
    </Button>
  );
}
```

- **Take only the id and load the latest data itself** (guidelines T3.8 and R1): `ProjectForm` renders only after the data arrives, so the form's default values are the latest data. Do not pass the record in from the drawer or the list.
- **Keep the data and state in the page component**, because `footer` has to change with the state: loading and load failure have only "Cancel"; record not found and no permission have only "Close"; "Save" appears only once the form is ready. Split the parts that need `close()` (`EditProjectBody`, `CloseButton`) into components inside the overlay.
- **Record not found**: a 404 on load, or `ProjectForm` calling `onNotFound` on save, both notify the drawer (`onNotFound`), which switches to "not found" and refreshes the list (guideline R3). The dialog explains the situation and keeps only "Close". After it closes, the "Edit" button is gone along with the drawer's footer actions, so focus lands on the drawer panel.
- **Success**: first call the drawer's `onSaved(saved)` (the drawer shows the new values at once and the list refreshes), then `close()`.
- Stacking: Esc closes only the dialog and returns to the drawer, and focus returns to the "Edit" button in the drawer.

### 3.4 The form component's interface

`ProjectForm` is the form component shared by create and edit; for how its fields, validation, submission and server errors are written, see `form.md`. The overlay pages use only its props:

```tsx
// client/pages/projects/project-form.tsx
// …
export interface ProjectFormProps {
  /** When editing, the latest record that was just loaded; omitted when creating. */
  readonly project?: Project;
  /** The id of the `<form>`. When the submit button is outside the form, the button sets `form={formId}`. */
  readonly formId: string;
  /** Called after a successful save, with the record the endpoint returned. The form has already shown the success message. */
  readonly onSubmitted: (project: Project) => void;
  /** Receives `true` when submission starts and `false` when it ends; on success, `false` comes before `onSubmitted` is called. */
  readonly onSubmittingChange?: (submitting: boolean) => void;
  /** The endpoint returned 404 while editing: the record has been deleted. */
  readonly onNotFound?: () => void;
}
// …
```

The form itself renders no buttons: the overlay page puts them in `footer`.

## 4. Delete confirmation (AlertDialog)

A confirmation dialog concerns a single action, so it uses component state. Make it one component, shared by the list's row menu and the detail drawer:

```tsx
// client/pages/projects/project-delete-dialog.tsx
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, type RefObject, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

import type { Project } from './types.js';

export interface ProjectDeleteDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The record to delete. The parent keeps it after closing, so the title does not go blank during the exit animation. */
  readonly project: Pick<Project, 'id' | 'name'> | null | undefined;
  /** Called when the delete succeeds or the record was already deleted by someone else (404). The parent closes the confirmation dialog (or the whole drawer) and refreshes the list. */
  readonly onDeleted: () => void;
  /** Where focus goes after the delete. The button that opened the confirmation dialog usually disappears along with the record (guideline A6). */
  readonly deletedFocusRef?: RefObject<HTMLElement | null>;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  project,
  onDeleted,
  deletedFocusRef,
}: ProjectDeleteDialogProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<'forbidden' | 'requestFailed'>();
  const deletedRef = useRef(false);

  async function confirmDelete(
    target: Pick<Project, 'id' | 'name'>,
  ): Promise<void> {
    setPending(true);
    setError(undefined);
    try {
      await api.request({ path: `projects/${target.id}`, method: 'DELETE' });
      toaster.show({
        type: 'success',
        title: t('projects.delete.success', { name: target.name }),
      });
    } catch (caught: unknown) {
      const status = caught instanceof ApiClientError ? caught.status : 0;
      if (status !== 404) {
        // Other failures: keep the confirmation dialog open and explain the reason inside it, without showing the backend's raw message.
        setError(status === 403 ? 'forbidden' : 'requestFailed');
        setPending(false);
        return;
      }
      // 404: someone else already deleted the record. What the user wanted has already happened, so explain that and treat it as a successful delete (guideline R3).
      toaster.show({
        type: 'info',
        title: t('projects.delete.notFound', { name: target.name }),
      });
    }
    setPending(false);
    deletedRef.current = true;
    onDeleted();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // No closing while the delete is in progress (Esc, clicking the backdrop and the cancel button all end up here).
        if (!next && pending) return;
        // Clear the error on close, so the next open starts clean.
        if (!next) setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent
        finalFocus={() => {
          const target = deletedRef.current ? deletedFocusRef?.current : null;
          deletedRef.current = false;
          // Returning true keeps the default behavior: focus returns to the element that had focus before the confirmation dialog opened.
          return target ?? true;
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('projects.delete.title', { name: project?.name ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('projects.delete.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role='alert' className='text-sm text-destructive'>
            {error === 'forbidden'
              ? t('projects.error.forbidden')
              : t('projects.error.requestFailed')}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          {/* AlertDialogAction does not close the confirmation dialog automatically: on success, onDeleted has the parent close it. */}
          <AlertDialogAction
            variant='destructive'
            // Without permission a retry will not succeed either, so the button can no longer be clicked (guideline S4).
            disabled={pending || error === 'forbidden'}
            onClick={() => {
              if (project) void confirmDelete(project);
            }}
          >
            {pending ? <Spinner data-icon='inline-start' /> : null}
            {t('projects.delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

Use it in the list page (the row menu's "Delete" calls `setDeletion({ open: true, project: row.original })`; for the complete page, see `table.md`):

```tsx
// client/pages/projects/index.tsx
export default function ProjectsPage(): ReactElement {
  // …

  // The delete confirmation dialog uses component state. Store the open state and the target separately: closing changes only open, so the title stays the same during the exit animation.
  const [deletion, setDeletion] = useState<{
    readonly open: boolean;
    readonly project: Project | null;
  }>({ open: false, project: null });

  // …

  return (
    <PageContainer>
      {/* … */}
      <ProjectDeleteDialog
        open={deletion.open}
        onOpenChange={(open) =>
          setDeletion((current) => ({ ...current, open }))
        }
        project={deletion.project}
        onDeleted={() => {
          setDeletion((current) => ({ ...current, open: false }));
          reload();
        }}
        deletedFocusRef={searchRef}
      />
      {/* … */}
    </PageContainer>
  );
}
```

For its use in the detail drawer, see `ProjectDetailActions` in 3.2.

- **Store the open state and the target separately**: closing only sets `open` to `false` and keeps `project`. If closing also clears the target, the title flashes to an empty name during the exit animation.
- **Title and buttons**: the title names the record, the description states the consequence, and the confirm button uses the destructive style and the specific action "Delete" (guidelines I2 and C7).
- `AlertDialogAction` does not close the confirmation dialog automatically: on success, the parent closes it in `onDeleted` (the list sets `open` to `false`; the drawer closes the whole drawer). `AlertDialogCancel` does close automatically.
- **While deleting**: `onOpenChange` ignores close requests (Esc, clicking the backdrop), both buttons are disabled, and the confirm button shows a `Spinner` (guideline S5).
- **Failure**: the confirmation dialog stays open and explains the reason inside it with `role='alert'` (guideline I3); without permission (403) the confirm button is disabled, and after other failures the user can click again to retry. Do not show the raw message the backend returned.
- **404**: someone else already deleted the record; say so with an `info` toast and treat it as a successful delete (guideline R3).
- **Where focus goes**: the deleted row disappears together with the menu that opened the confirmation dialog, so the list passes `deletedFocusRef={searchRef}`, and focus lands on the search box after the delete (guideline A6). The drawer does not pass it: the drawer closes, and the list's `afterDelete` handles focus.
- When the confirmation dialog renders inside the drawer (in the drawer's `footer`), Esc closes only the confirmation dialog.

## 5. Sheet: temporary panels

Use `Sheet` for side panels that do not represent a record or a location and need no direct link (explanations, help and so on), and keep the open state in the component. Use `RouteDrawer` for record details, not `Sheet`.

```tsx
// client/pages/projects/status-help-sheet.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { InfoIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
        <dl className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4'>
          {PROJECT_STATUSES.map((status) => (
            <div key={status} className='space-y-1'>
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

- Use `SheetTrigger render={<Button />}` for the trigger button and `SheetClose render={<Button />}` for the close button. To control opening and closing from code, pass `open` and `onOpenChange` to `Sheet`.
- `side` defaults to `'right'`; the other options are `'left'`, `'top'` and `'bottom'`. On the left and right sides the width is `w-3/4 sm:max-w-sm`; adjust it with `className`.
- `SheetContent` is a vertical flex container and does not scroll itself: give the content area `min-h-0 flex-1 overflow-y-auto`. `SheetFooter` sits at the bottom, with its buttons stacked vertically.
- `SheetContent` has a built-in close button in the top-right corner (remove it with `showCloseButton={false}`); its accessible name is currently hard-coded to the English "Close".

## 6. Verification checklist

After implementing, confirm each item by actually trying it:

- [ ] Overlays such as create, edit and detail views are all child routes; only confirmation dialogs and temporary panels use component state.
- [ ] The parent page places `<Outlet />` in the intended spot; an overlay with child routes also places `<Outlet />` inside itself.
- [ ] The right one of `RouteDialog` / `RouteDrawer` is chosen; child routes declare no `navigation` or `breadcrumb`.
- [ ] `useRouteOverlay()` is called in components inside the overlay, not in the page component that renders the overlay; when `beforeClose` can throw, the rejection from `close()` is handled.
- [ ] While submitting or deleting, ×, Esc, clicking the backdrop and "Cancel" all fail to close it; where needed, there is a confirmation for unsaved changes.
- [ ] Opening a child route's URL directly (with the deployment base path, for example `/main/projects/12/edit`), refreshing, browser back and forward, and nested overlays all show the correct layers.
- [ ] Opening and closing overlays keeps the query parameters, so the search and filters of the list behind stay the same; the parent page stays mounted and does not reload.
- [ ] After saving, the drawer shows the new values immediately, and the list refreshes afterwards (guideline R2).
- [ ] Record not found: the situation is explained, no "Retry" is offered, and the list refreshes (guideline R3); other load failures can be retried (guideline S4).
- [ ] Delete: failures are explained in the confirmation dialog, a 404 is treated as success, and focus lands on the search box after the delete (guideline A6).
- [ ] Esc closes only the topmost layer; after closing, focus returns to the element that opened it, or lands in a stable place when that element is gone.
- [ ] At a width of 375px, overlays stay within the screen, the content area scrolls, and the bottom buttons are reachable (guideline A4).
- [ ] Without permission for the parent route, the child route's URL does not open either.
- [ ] The new route names are in the route test's page grant list (see section 12 of `page.md`).
