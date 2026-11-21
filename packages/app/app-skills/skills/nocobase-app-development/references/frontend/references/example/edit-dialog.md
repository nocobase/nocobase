# Edit dialog: `detail/edit.tsx`

Part of the [projects worked example](../example.md). **Depends on**: [form](project-form.md), [types](types.md); the `edit` route under the detail drawer, so `/projects/:projectId/edit` stacks the dialog on the drawer and closing returns to it. The row menu's Edit links to the same URL ([routes](../example.md#routes)).

Rules: [`overlay.md`](../overlay.md), ["Default values are read only on mount" in `form.md`](../form.md#default-values-are-read-only-on-mount), guidelines T3.1, T3.5 and T3.9.

The dialog reads the record fresh rather than trusting the row that opened it, and mounts the form only once the record is there, keyed by it, so the form's default and saved values are the stored record. A missing, denied or failed read shows `RequestError` inside the dialog with Cancel as the only way on.

```tsx
// client/pages/projects/detail/edit.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';
import { useParams } from 'react-router';

import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';
import { useListData } from '#hooks/use-list-data';

import { ProjectForm } from '../project-form.js';
import { RequestError } from '../request-error.js';
import { type Project, projectScope } from '../types.js';

const FORM_ID = 'project-edit-form';

export default function EditProjectPage(): ReactElement {
  const { t } = useTranslation();
  const projectId = useParams().projectId ?? '';
  const request = useListData<{ data: Project }>(
    `projects/${encodeURIComponent(projectId)}`,
    { scopes: [projectScope(projectId)] },
  );
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const project = request.error ? undefined : request.data?.data;
  return (
    <RouteDialog
      title={t('projects.edit.title')}
      className='sm:max-w-lg'
      beforeClose={() => !submittingRef.current}
      footer={<Footer submitting={submitting} canSubmit={Boolean(project)} />}
    >
      {request.error ? (
        <RequestError error={request.error} retry={request.reload} />
      ) : project ? (
        <Body
          key={project.id}
          project={project}
          onSubmittingChange={(value) => {
            submittingRef.current = value;
            setSubmitting(value);
          }}
        />
      ) : (
        <div
          role='status'
          aria-label={t('projects.loading')}
          className='flex flex-col gap-3'
        >
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-8 w-full' />
        </div>
      )}
    </RouteDialog>
  );
}

function Body({
  project,
  onSubmittingChange,
}: {
  readonly project: Project;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  // The form announced the saved record: the drawer below shows it without a request, the list reads again.
  return (
    <ProjectForm
      project={project}
      formId={FORM_ID}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => void close()}
    />
  );
}

function Footer({
  submitting,
  canSubmit,
}: {
  readonly submitting: boolean;
  readonly canSubmit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        variant='outline'
        disabled={submitting}
        onClick={() => void close()}
      >
        {t('projects.actions.cancel')}
      </Button>
      {canSubmit ? (
        <Button type='submit' form={FORM_ID} disabled={submitting}>
          {submitting ? <Spinner data-icon='inline-start' /> : null}
          {t(submitting ? 'projects.actions.saving' : 'projects.actions.save')}
        </Button>
      ) : null}
    </>
  );
}
```

Because the dialog declares the record's scope, a save made elsewhere while it is open replaces `request.data`; the `key` keeps the mounted form and its input, and the "Discard changes?" question still compares against the values the form started from. When the save finds the record gone (404), the form shows the explanation and announces the scope, so the drawer below switches to its missing state.
