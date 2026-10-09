# Settings page: `settings/projects/index.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [members card](members-card.md), [session alert](session-expired-alert.md), [copy](copy.md); the settings route and item in ["Settings pages" in `page.md`](../page.md#settings-pages).

**Add first**: `yes n | pnpm exec shadcn add alert card skeleton`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: ["Settings pages" in `page.md`](../page.md#settings-pages), and guideline T4.

```tsx
// client/pages/settings/projects/index.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { Skeleton } from '#components/ui/skeleton';

import { ProjectMembersCard } from './members-card.js';

interface ProjectDefaults {
  /** Emails added to every new project. */
  readonly defaultMembers: readonly string[];
}

/** Route /settings/projects: the page opens with read on project-settings; changing it needs update. */
export default function ProjectSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  // Keep in sync with the item the server registers and the PATCH endpoint checks.
  const update = useCan({
    resource: { type: 'settings', id: 'project-settings' },
    action: 'update',
  });

  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<{
    readonly key: number;
    readonly settings?: ProjectDefaults;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    const key = reloadCount;
    api
      .request<{ data: ProjectDefaults }>({
        path: 'projectSettings',
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, settings: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ key, error });
        },
      );
    return () => controller.abort();
  }, [api, reloadCount]);

  const loading = result?.key !== reloadCount;
  const error = loading ? undefined : result?.error;
  const settings = result?.settings;

  // ProjectMembersCard shows the success toast, and on a rejection its own error, keeping the input.
  async function saveMembers(defaultMembers: string[]): Promise<void> {
    const { data } = await api.request<{ data: ProjectDefaults }>({
      path: 'projectSettings',
      method: 'PATCH',
      json: { defaultMembers },
    });
    setResult({ key: reloadCount, settings: data });
  }

  let content: ReactElement;
  if (error instanceof ApiClientError && error.status === 401) {
    content = <SessionExpiredAlert />;
  } else if (error) {
    // Without read permission a retry cannot succeed, so offer none (guideline S4).
    const forbidden = error instanceof ApiClientError && error.status === 403;
    content = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {forbidden
            ? t('projectSettings.error.forbidden')
            : t('projectSettings.error.requestFailed')}
        </AlertDescription>
        {forbidden ? null : (
          <AlertAction>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setReloadCount((count) => count + 1)}
            >
              {t('status.retry')}
            </Button>
          </AlertAction>
        )}
      </Alert>
    );
  } else if (update.error) {
    // The update check itself failed: which variant to show is unknown, so offer a retry (page.md section 8).
    content = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {t('projectSettings.error.permissionCheckFailed')}
        </AlertDescription>
        <AlertAction>
          <Button variant='outline' size='sm' onClick={update.retry}>
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (!settings || update.isPending) {
    // Wait for the update check too, so the editable card never appears and then turns read-only.
    content = (
      <div
        role='status'
        aria-label={t('status.loading')}
        className='flex flex-col gap-3 rounded-lg border p-6'
      >
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-8 w-full' />
      </div>
    );
  } else if (update.can) {
    content = (
      <ProjectMembersCard
        members={settings.defaultMembers}
        onSave={saveMembers}
      />
    );
  } else {
    // Read-only: the user may see the settings but not change them.
    content = (
      <Card>
        <CardHeader>
          <CardTitle>{t('projects.members.title')}</CardTitle>
          <CardDescription>{t('projectSettings.readOnly')}</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.defaultMembers.length > 0 ? (
            <ul className='flex flex-col gap-1 text-sm'>
              {settings.defaultMembers.map((email) => (
                <li key={email} className='wrap-anywhere'>
                  {email}
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm text-muted-foreground'>—</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('projectSettings.title')}
        description={t('projectSettings.description')}
      />
      {/* A settings page mainly holds forms, so its content width is limited (guideline L4). */}
      <div className='max-w-2xl'>{content}</div>
    </PageContainer>
  );
}
```
