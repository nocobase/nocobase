# Edit dialog: `detail/edit.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [form](project-form.md), [session alert](session-expired-alert.md), [types](types.md), [copy](copy.md); its two routes in [section 1 of `page.md`](../page.md#1-declare-the-route): `edit/:projectId` under the list, and `edit` under the drawer.

**Add first**: `yes n | pnpm exec shadcn add alert skeleton`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: [section 2 of `overlay.md`](../overlay.md#2-overlays-as-child-routes), and ["Default values are read only on mount" in `form.md`](../form.md#default-values-are-read-only-on-mount).

```tsx
// client/pages/projects/detail/edit.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { useRouteOverlay } from '@/components/use-route-overlay';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { ProjectForm } from '../project-form.js';
import type { Project, ProjectEditOutletContext } from '../types.js';

const FORM_ID = 'project-edit-form';

/**
 * Edit a project. Two routes load it: `/projects/edit/:projectId`, which a row's menu opens alone over the list, and
 * `/projects/:projectId/edit`, which the drawer's "Edit" stacks on the drawer. Both name the parameter `projectId`.
 */
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
  // Callbacks of the view behind the dialog through <Outlet context>: the drawer, or the list for a row's menu.
  const { onNotFound } = useOutletContext<ProjectEditOutletContext>();

  // The state disables the buttons; the ref is for beforeClose to read: when close() runs right after a successful save, the new state value has not rendered yet.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean) => {
    submittingRef.current = value;
    setSubmitting(value);
  };

  // On open, load the latest data by id before rendering the form, instead of the drawer's or the list's possibly stale data (guidelines T3.8 and R1).
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
          // The record no longer exists: tell the view behind, so the drawer switches to "not found" and the list refreshes (guideline R3).
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
  if (status === 401) {
    body = <SessionExpiredAlert />;
    footer = <CloseButton label={t('actions.close')} />;
  } else if (notFound || status === 403) {
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
  const { onSaved } = useOutletContext<ProjectEditOutletContext>();
  return (
    <ProjectForm
      formId={FORM_ID}
      project={project}
      onSubmittingChange={onSubmittingChange}
      onNotFound={onNotFound}
      onSubmitted={(saved) => {
        // First let the view behind show the saved record (the drawer at once, the list by refreshing), then close the dialog (guideline R2).
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

- **Two routes, one dialog**: a row's menu opens it at `/projects/edit/12`, alone over the list, and closing returns to the list; the drawer's "Edit" opens it at `/projects/12/edit`, stacked on the drawer, and closing returns to the drawer ([section 2.1 of `overlay.md`](../overlay.md#21-declare-the-child-routes)). It reads the same `ProjectEditOutletContext` from either view, so nothing in it depends on where it opened.
- **Take only the id and load the latest data itself** (guidelines T3.8 and R1): `ProjectForm` renders only after the data arrives, so the form's default values are the latest data. Do not pass the record in from the drawer or the list.
- **Keep the data and state in the page component**, because `footer` has to change with the state: loading and load failure have only "Cancel"; record not found and no permission have only "Close"; "Save" appears only once the form is ready. Split the parts that need `close()` (`EditProjectBody`, `CloseButton`) into components inside the overlay.
- **Record not found**: a 404 on load, or `ProjectForm` calling `onNotFound` on save, both call the view behind (`onNotFound`): the drawer switches to "not found" and refreshes the list, and the list refreshes itself (guideline R3). The dialog explains the situation and keeps only "Close". Over the drawer, the "Edit" button is gone along with the drawer's footer actions after it closes, so focus lands on the drawer panel.
- **Success**: first call `onSaved(saved)` of the view behind (the drawer shows the new values at once and the list refreshes), then `close()`.
- Closing: over the drawer, Esc closes only the dialog and focus returns to the drawer's "Edit" button; over the list, closing returns to the list and focus to the row's "More" button.
