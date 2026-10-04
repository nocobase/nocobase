# A setting that applies on toggle: `project-public-switch.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add field switch`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: ["Checkbox and Switch" in `form.md`](../form.md#checkbox-and-switch), and guideline T4.3. Assumes the backend provides `PATCH /api/projects/:id/settings`.

```tsx
// client/pages/projects/project-public-switch.tsx
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useId, useState } from 'react';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

export interface ProjectPublicSwitchProps {
  readonly projectId: string;
  /** The saved value, from the latest load of the settings. */
  readonly isPublic: boolean;
  /** Called with the value the endpoint saved; the parent keeps it as the new saved value. */
  readonly onSaved: (isPublic: boolean) => void;
}

/** Takes effect when toggled (guideline T4.3): no form and no Save button. */
export function ProjectPublicSwitch({
  projectId,
  isPublic,
  onSaved,
}: ProjectPublicSwitchProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { refresh } = useAuthentication();
  const id = useId();
  // The value being saved: shown while the request runs, cleared afterwards, so a failure falls back to the saved value.
  const [pending, setPending] = useState<boolean>();

  async function change(next: boolean): Promise<void> {
    setPending(next);
    try {
      const { data } = await api.request<{ data: { isPublic: boolean } }>({
        path: `projects/${encodeURIComponent(projectId)}/settings`,
        method: 'PATCH',
        json: { isPublic: next },
      });
      onSaved(data.isPublic);
      toaster.show({
        type: 'success',
        title: data.isPublic
          ? t('projects.settings.publicOn')
          : t('projects.settings.publicOff'),
      });
    } catch (error: unknown) {
      // No dialog to show the error in, so use an error toast (guideline I3); the switch returns to the saved value.
      const status = error instanceof ApiClientError ? error.status : undefined;
      toaster.show({
        type: 'error',
        title:
          status === 401
            ? t('status.sessionExpired')
            : status === 403
              ? t('projects.error.forbidden')
              : t('projects.error.requestFailed'),
        // A 401 offers to sign in again; the user chooses when, since refresh() blanks the signed-in pages.
        action:
          status === 401
            ? {
                label: t('actions.signInAgain'),
                onClick: () => void refresh(),
              }
            : undefined,
      });
    } finally {
      setPending(undefined);
    }
  }

  return (
    <Field orientation='horizontal'>
      <FieldContent>
        <FieldLabel htmlFor={id}>{t('projects.fields.isPublic')}</FieldLabel>
        <FieldDescription>{t('projects.form.isPublicHint')}</FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        checked={pending ?? isPublic}
        // Disabled while saving, so a second click cannot race the first request.
        disabled={pending !== undefined}
        onCheckedChange={(checked) => void change(checked)}
      />
    </Field>
  );
}
```
