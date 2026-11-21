# Endpoints, types and shared pieces

Part of the [projects worked example](../example.md). Rules: ["Calling an endpoint"](../api.md#calling-an-endpoint), ["Error handling"](../api.md#error-handling) and [data scopes](../data-changes.md).

The example assumes the backend provides these endpoints. Writes take an `Idempotency-Key` header ([submission protection](../../../submission.md)).

| Method and path            | Description                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/projects`        | Optional `q`, `status`, `orderBy` (`updatedAt desc` by default, or `name`), `page` (from 1), `pageSize` (≤ 100); returns `{ data, meta: { page, pageSize, total } }` |
| `GET /api/projects/:id`    | `{ data: Project }`; 404 if it does not exist                                                                                                                        |
| `POST /api/projects`       | Body `{ name, owner, status }`; `201 { data: Project }`; 409 with reason `PROJECT_NAME_TAKEN` for a duplicate name                                                   |
| `PATCH /api/projects/:id`  | Changes only the fields sent; `{ data: Project }`; 404 if it does not exist                                                                                          |
| `DELETE /api/projects/:id` | 204; 404 if it does not exist                                                                                                                                        |

Permissions are checked on the server and mirrored on the client with `useCan({ resource: { type: 'project', id: '*' }, action })` for `create`, `update` and `delete` ([`page.md`](../page.md)).

```ts
// client/pages/projects/types.ts
import { TABLE_URL_KEYS } from '#hooks/use-table-url-state';

export const PROJECT_STATUSES = ['planning', 'active', 'done'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** The list's own URL keys; a view returning to the list carries only these. */
export const PROJECT_LIST_KEYS = ['q', 'status', ...TABLE_URL_KEYS] as const;

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly owner: string | null;
  readonly status: ProjectStatus;
  readonly updatedAt: string;
}

export interface ProjectList {
  readonly data: Project[];
  readonly meta: { page: number; pageSize: number; total: number };
}

/** Every view of projects declares these; every write announces them (data-changes.md). */
export const projectsScope = 'projects';
export const projectScope = (id: string) => `${projectsScope}/${id}`;

export const projectPermission = (action: 'create' | 'update' | 'delete') => ({
  resource: { type: 'project', id: '*' },
  action,
});
```

The status badge maps each status to a tone of the template's `StatusBadge` and a translated label ([dynamic keys in `i18n.md`](../i18n.md#dynamic-keys)):

```tsx
// client/pages/projects/status-badge.tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { StatusBadge } from '#components/status-badge';

import type { ProjectStatus } from './types.js';

const TONES = { planning: 'neutral', active: 'info', done: 'success' } as const;

export function ProjectStatusBadge({
  status,
}: {
  readonly status: ProjectStatus;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <StatusBadge tone={TONES[status]}>
      {t(`projects.status.${status}`)}
    </StatusBadge>
  );
}
```

`RequestError` explains a failed read or write the same way everywhere in the feature: sign in again on 401, no Retry on 403 or 404, Retry otherwise (guidelines S1 and S4). Lists use `DataTable`'s built-in states instead.

```tsx
// client/pages/projects/request-error.tsx
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';

export function RequestError({
  error,
  retry,
}: {
  readonly error: unknown;
  readonly retry?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const status = error instanceof ApiClientError ? error.status : 0;
  const key =
    status === 401
      ? 'projects.error.sessionExpired'
      : status === 403
        ? 'projects.error.forbidden'
        : status === 404
          ? 'projects.error.notFound'
          : 'projects.error.requestFailed';
  return (
    <Alert variant='destructive'>
      <AlertDescription>{t(key)}</AlertDescription>
      <AlertAction>
        {status === 401 ? (
          <Button
            variant='outline'
            size='sm'
            nativeButton={false}
            render={<Link to='/login' />}
          >
            {t('projects.actions.signIn')}
          </Button>
        ) : retry && ![403, 404].includes(status) ? (
          <Button variant='outline' size='sm' onClick={retry}>
            {t('projects.actions.retry')}
          </Button>
        ) : null}
      </AlertAction>
    </Alert>
  );
}
```

Add the `projects.*` keys these files use to both locale files ([`i18n.md`](../i18n.md)); the list's built-in states use the template's shared `listFeedback.*` keys.
