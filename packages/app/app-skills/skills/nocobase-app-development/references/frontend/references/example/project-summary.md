# Loading a record: `project-summary.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [status badge](../i18n.md#dynamic-keys), [session alert](session-expired-alert.md), [types](types.md), [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add alert card skeleton`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: ["Loading data in a component" in `api.md`](../api.md#loading-data-in-a-component).

```tsx
// client/pages/projects/project-summary.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { ProjectStatusBadge } from './status-badge.js';
import type { Project } from './types.js';

export interface ProjectSummaryProps {
  readonly projectId: string;
}

/**
 * Loads a project by id and displays it.
 * When projectId can change, the parent sets `key={projectId}`: switching records starts the state over, so the previous record is never shown first.
 */
export function ProjectSummary({
  projectId,
}: ProjectSummaryProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${projectId}:${reloadCount}`;
  // Store each result together with the request that produced it.
  const [result, setResult] = useState<{
    readonly key: string;
    readonly project?: Project;
    readonly error?: unknown;
  }>();
  const cardRef = useRef<HTMLDivElement>(null);

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
          if (!controller.signal.aborted) setResult({ key, error });
        },
      );
    return () => controller.abort();
  }, [api, projectId, reloadCount]);

  // If the result is not from the current request, it is still loading.
  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  // During a reload this is still the last successful data, so the UI does not have to be cleared.
  const project = result?.project;

  function reload(): void {
    setReloadCount((count) => count + 1);
  }

  let body: ReactElement;
  if (error instanceof ApiClientError && error.status === 401) {
    // The session ended: signing in again is the only way forward (guideline S4).
    body = <SessionExpiredAlert />;
  } else if (error instanceof ApiClientError && error.status === 404) {
    // The record does not exist: retrying will not succeed either, so no "Retry".
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('projects.error.notFound')}</AlertDescription>
      </Alert>
    );
  } else if (error instanceof ApiClientError && error.status === 403) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('projects.error.forbidden')}</AlertDescription>
      </Alert>
    );
  } else if (error) {
    // Temporary problems such as network failures and server errors: offer "Retry". Do not show error.message.
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('projects.error.requestFailed')}</AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              reload();
              // The button disappears along with the error, so move focus to the card (guideline A6).
              cardRef.current?.focus();
            }}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (!project) {
    body = (
      <div
        role='status'
        aria-label={t('status.loading')}
        className='flex flex-col gap-3'
      >
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-1/3' />
      </div>
    );
  } else {
    body = (
      <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
        <dt className='text-muted-foreground'>{t('projects.fields.owner')}</dt>
        <dd className='min-w-0 wrap-anywhere'>
          {project.owner ?? <span className='text-muted-foreground'>—</span>}
        </dd>
        <dt className='text-muted-foreground'>{t('projects.fields.status')}</dt>
        <dd>
          <ProjectStatusBadge status={project.status} />
        </dd>
      </dl>
    );
  }

  return (
    <Card ref={cardRef} tabIndex={-1}>
      <CardHeader>
        <CardTitle>{project?.name ?? t('projects.detail.title')}</CardTitle>
        {project ? (
          <CardAction>
            {/* Keep the content while reloading, and show the loading state only on the button (guideline I4). */}
            <Button
              variant='outline'
              size='sm'
              disabled={loading}
              onClick={reload}
            >
              {loading ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <RefreshCwIcon data-icon='inline-start' />
              )}
              {t('projects.actions.refresh')}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
```
