# Delete confirmation: `project-delete-dialog.tsx`

Part of the [projects worked example](../example.md). **Depends on**: [types](types.md). Used by the [list page](list-page.md) and the [detail drawer](detail-drawer.md).

Rules: ["Delete confirmation" in `overlay.md`](../overlay.md), [delete and recover a list](../table.md#delete-and-recover-a-list), the outcome table of [data changes](../data-changes.md#outcomes), guideline R3.

The confirmation is component state, not a route: it belongs to one click. A confirmed delete, and a 404 (someone else deleted it first, which is what the user wanted), announce `null` for the record's scope, so the list drops the row and an open drawer switches to its missing state. A network failure or 5xx announces the scope without a result, so the views read what actually happened; the dialog never replays the delete by itself.

```tsx
// client/pages/projects/project-delete-dialog.tsx
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

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
import { Spinner } from '#components/ui/spinner';
import { announceDataChange } from '#hooks/use-data-changes';

import { RequestError } from './request-error.js';
import { type Project, projectScope } from './types.js';

export interface ProjectDeleteDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Kept by the parent after closing, so the title does not go blank during the exit animation. */
  readonly project: Pick<Project, 'id' | 'name'> | null;
  /** Runs after the delete was confirmed and announced, such as closing the drawer it was opened from. */
  readonly onDeleted?: () => void;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  project,
  onDeleted,
}: ProjectDeleteDialogProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();

  async function confirm(target: Pick<Project, 'id' | 'name'>): Promise<void> {
    const scope = projectScope(target.id);
    setPending(true);
    setError(undefined);
    try {
      await api.request({
        path: `projects/${encodeURIComponent(target.id)}`,
        method: 'DELETE',
      });
      toaster.show({
        type: 'success',
        title: t('projects.delete.success', { name: target.name }),
      });
    } catch (caught: unknown) {
      const status = caught instanceof ApiClientError ? caught.status : 0;
      if (status !== 404) {
        // Keep the dialog open and explain; an unknown outcome makes the views verify.
        if (status === 0 || status >= 500)
          announceDataChange({ scopes: [scope] });
        setError(caught);
        setPending(false);
        return;
      }
      toaster.show({
        type: 'info',
        title: t('projects.delete.notFound', { name: target.name }),
      });
    }
    setPending(false);
    announceDataChange({ scopes: [scope], results: { [scope]: null } });
    onOpenChange(false);
    onDeleted?.();
  }

  const status = error instanceof ApiClientError ? error.status : 0;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return; // no closing while the request runs
        if (!next) setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('projects.delete.title', { name: project?.name ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('projects.delete.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <RequestError error={error} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t('projects.actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            // Without permission or a session a second click cannot succeed (guideline S4).
            disabled={pending || status === 401 || status === 403}
            onClick={() => {
              if (project) void confirm(project);
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

Focus: after a delete from a row's menu the trigger disappears with the row; move focus to a stable target such as the page heading (guideline A6), as the [executable list](../executable-list-edit.md) does when it becomes visible again.
