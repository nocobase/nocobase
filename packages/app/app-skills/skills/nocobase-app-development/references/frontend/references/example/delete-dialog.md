# Delete confirmation: `project-delete-dialog.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [session alert](session-expired-alert.md), [types](types.md), [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add alert-dialog`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: [section 4 of `overlay.md`](../overlay.md#4-delete-confirmation-alertdialog).

```tsx
// client/pages/projects/project-delete-dialog.tsx
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, type RefObject, useRef, useState } from 'react';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
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
  const [error, setError] = useState<
    'sessionExpired' | 'forbidden' | 'requestFailed'
  >();
  const deletedRef = useRef(false);

  async function confirmDelete(
    target: Pick<Project, 'id' | 'name'>,
  ): Promise<void> {
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
        // Other failures: keep the confirmation dialog open and explain the reason inside it, without showing the backend's raw message.
        setError(
          status === 401
            ? 'sessionExpired'
            : status === 403
              ? 'forbidden'
              : 'requestFailed',
        );
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
        // No closing while the delete is in progress (Esc and the cancel button end up here; an AlertDialog ignores backdrop clicks).
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
        {error === 'sessionExpired' ? (
          // The session ended: offer to sign in again rather than a retry that cannot succeed.
          <SessionExpiredAlert />
        ) : error ? (
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
            disabled={
              pending || (error !== undefined && error !== 'requestFailed')
            }
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
