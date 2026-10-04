# A single-click write: `complete-project-button.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [types](types.md), [copy](copy.md).

Rules: ["Write operations" in `api.md`](../api.md#write-operations).

```tsx
// client/pages/projects/complete-project-button.tsx
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import type { Project } from './types.js';

export interface CompleteProjectButtonProps {
  readonly project: Project;
  /** Called on success with the latest record the endpoint returned. */
  readonly onCompleted: (project: Project) => void;
  /** Called when the record has been deleted (404); usually closes the detail view and refreshes the list. */
  readonly onGone: () => void;
}

/** "Mark as done" button: a click changes the record directly, with no form or confirmation. */
export function CompleteProjectButton({
  project,
  onCompleted,
  onGone,
}: CompleteProjectButtonProps): ReactElement | null {
  const { t } = useTranslation();
  // Hooks can only be called at the top level of a component or custom hook, never inside event handlers, conditions or loops.
  const api = useApiClient();
  const toaster = useToaster();
  const { refresh } = useAuthentication();
  const [pending, setPending] = useState(false);

  async function complete(): Promise<void> {
    setPending(true);
    try {
      const result = await api.request<{ data: Project }>({
        path: `projects/${encodeURIComponent(project.id)}`,
        method: 'PATCH',
        json: { status: 'done' },
      });
      toaster.show({
        type: 'success',
        title: t('projects.complete.success', { name: project.name }),
      });
      onCompleted(result.data);
    } catch (error: unknown) {
      // This action has no dialog, so errors have no fixed place to appear; use a toast.
      if (error instanceof ApiClientError && error.status === 401) {
        // The session ended: offer to sign in again; the user chooses when, since refresh() blanks the signed-in pages.
        toaster.show({
          type: 'error',
          title: t('status.sessionExpired'),
          action: {
            label: t('actions.signInAgain'),
            onClick: () => void refresh(),
          },
        });
      } else if (error instanceof ApiClientError && error.status === 404) {
        toaster.show({
          type: 'error',
          // A toast is short (guideline C5): the record's name, not the inline alert's longer sentence.
          title: t('projects.complete.notFound', { name: project.name }),
        });
        onGone();
      } else if (error instanceof ApiClientError && error.status === 403) {
        toaster.show({
          type: 'error',
          title: t('projects.error.forbidden'),
        });
      } else {
        // Network errors are not ApiClientError and end up here too. Do not show error.message.
        toaster.show({
          type: 'error',
          title: t('projects.error.requestFailed'),
        });
      }
    } finally {
      setPending(false);
    }
  }

  // A done project has nothing to complete: hide the action rather than disable it without a reason (guideline I7).
  if (project.status === 'done') return null;

  return (
    <Button
      variant='outline'
      disabled={pending}
      onClick={() => void complete()}
    >
      {pending ? (
        <Spinner data-icon='inline-start' />
      ) : (
        <CheckIcon data-icon='inline-start' />
      )}
      {t('projects.complete.action')}
    </Button>
  );
}
```
