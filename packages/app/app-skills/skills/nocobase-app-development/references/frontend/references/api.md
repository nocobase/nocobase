# Calling backend endpoints

Every endpoint request goes through the HTTP client the application provides:

- **Do not** create your own client, do not use `fetch` or axios, do not hard-code `/api`, and do not build endpoint URLs from `location`. The client's `api.baseURL` already includes the deployment base path (for example `/main`).
- Import `useApiClient`, `apiClientToken`, the `ApiClient` type and `ApiClientError` from `@nocobase/app-client`. That way the application and plugins share one runtime and one error class, which is what makes `instanceof ApiClientError` reliable.

## Endpoints and types used in the examples

All code in this handbook comes from the example "projects" domain and assumes the backend provides these endpoints:

| Method and path            | Description                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/projects`        | Parameters `search` and `status` (optional); returns `{ data: Project[] }`                                                      |
| `GET /api/projects/:id`    | Returns `{ data: Project }`; 404 if it does not exist                                                                           |
| `POST /api/projects`       | Request body `{ name, owner, status }`; returns `{ data: Project }`; 409 with `code: 'PROJECT_NAME_TAKEN'` for a duplicate name |
| `PATCH /api/projects/:id`  | Changes only the fields sent; returns `{ data: Project }`; 404 if it does not exist                                             |
| `DELETE /api/projects/:id` | 204 on success; 404 if it does not exist                                                                                        |

The frontend types live in the page folder, in `client/pages/projects/types.ts`:

```ts
export const PROJECT_STATUSES = ['planning', 'active', 'done'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  readonly id: number;
  readonly name: string;
  readonly owner: string | null;
  readonly status: ProjectStatus;
  readonly updatedAt: string;
}
```

## Getting the client

| Where                               | How                                         |
| ----------------------------------- | ------------------------------------------- |
| Components, custom hooks            | `useApiClient()`                            |
| Methods of a client ServiceProvider | `this.app.services.resolve(apiClientToken)` |
| Plain functions                     | Passed in by the caller, typed `ApiClient`  |

- `useApiClient()` is the same as `useService(apiClientToken)`: both return the current application's one client, and both can only be called inside the application (below `AppClientRoot`). It does not create a client and does not manage request state: you write loading and failure handling yourself (see "Loading data in a component").
- Do not create or resolve the client at module top level.

### In components and custom hooks

Like any other hook, `useApiClient()` can only be called at the top level of a component or custom hook; the `api` it returns can be used in event handlers, effects and returned functions. Here is a custom hook in the page folder (`client/pages/projects/use-set-project-status.ts`):

```ts
import { useApiClient } from '@nocobase/app-client';
import { useCallback } from 'react';

import type { Project, ProjectStatus } from './types.js';

/** The page's own hook: returns a function that changes a project's status. */
export function useSetProjectStatus(): (
  id: number,
  status: ProjectStatus,
) => Promise<Project> {
  // Get the client at the top level of the hook; the returned function can be called from event handlers.
  const api = useApiClient();
  return useCallback(
    async (id: number, status: ProjectStatus) => {
      const { data } = await api.request<{ data: Project }>({
        path: `projects/${id}`,
        method: 'PATCH',
        json: { status },
      });
      return data;
    },
    [api],
  );
}
```

For complete usage in components, see `ProjectSummary` (loading data) and `CompleteProjectButton` (a write) below.

### In a client ServiceProvider

Resolve it with `this.app.services.resolve(apiClientToken)` in methods such as `boot()` and `start()`. During `register()` the providers are still registering their services, so do not resolve it there, in a constructor or at module top level. The following adds a provider to `client/service-provider.ts`:

```ts
import { apiClientToken, ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

// …

/** Reports once after the application starts (assumes the backend provides POST /api/client-events). */
export class ClientEventsProvider extends ServiceProvider<ClientApplication> {
  // Name a provider after the application's package, as client/service-provider.ts does.
  public readonly name: string = 'my-app/client-events';

  public override start(): Promise<void> {
    // Resolve in methods such as boot() and start(): by then every provider has finished register().
    const api = this.app.services.resolve(apiClientToken);
    // Do not wait for the result; a failure is only logged and does not affect application startup.
    void api
      .request({
        path: 'client-events',
        method: 'POST',
        json: { type: 'app-started' },
      })
      .catch((error: unknown) => {
        console.warn('Failed to report the client start', error);
      });
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  ClientEventsProvider,
];

export default serviceProviders;
```

- If the Promise returned by `start()` rejects, the whole application fails to start; awaiting a request also delays startup. Do not await requests the application can do without, and handle their failures yourself.

### In plain functions

Plain functions cannot call hooks. When one needs the client, the caller passes it in, with the parameter typed `ApiClient`. When the same request repeats across several components of a page, you can write it as a function like this in the page folder (`client/pages/projects/project-api.ts`):

```ts
import type { ApiClient } from '@nocobase/app-client';

import type { Project, ProjectStatus } from './types.js';

export interface ProjectChanges {
  readonly name?: string;
  readonly owner?: string | null;
  readonly status?: ProjectStatus;
}

// A plain function cannot call hooks: the caller passes the client in.
export async function fetchProject(
  api: ApiClient,
  id: number | string,
  signal?: AbortSignal,
): Promise<Project> {
  const { data } = await api.request<{ data: Project }>({
    path: `projects/${encodeURIComponent(id)}`,
    signal,
  });
  return data;
}

export async function updateProject(
  api: ApiClient,
  id: number,
  changes: ProjectChanges,
): Promise<Project> {
  const { data } = await api.request<{ data: Project }, ProjectChanges>({
    path: `projects/${id}`,
    method: 'PATCH',
    json: changes,
  });
  return data;
}
```

- In a component, first `const api = useApiClient()`, then call `fetchProject(api, id, controller.signal)`.
- The second type parameter of `request` constrains the type of `json`, for example `ProjectChanges` above.

## Calling an endpoint

`api.request(options)` sends one request and returns the parsed response body.

### HTTP methods

`method` is uppercase and defaults to `GET`; the choices are `GET`, `POST`, `PUT`, `PATCH`, `DELETE` and `HEAD` (`OPTIONS` is not supported). The method only decides what request is sent: which methods an endpoint accepts, what request body it takes and what it returns are decided by the server route.

| Method          | Use                                                                  | Notes                                                                                                                                                |
| --------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET` (default) | Read data                                                            | Parameters go in `query`; cannot carry `json` or `body`                                                                                              |
| `POST`          | Create a record, or trigger an action                                | The request body goes in `json`; whether a body is needed depends on the endpoint                                                                    |
| `PUT`           | Replace as a whole (when the endpoint defines replacement semantics) | Send all the writable fields the endpoint requires; do not assume omitted fields are kept                                                            |
| `PATCH`         | Partial update (when the endpoint supports it)                       | `json` is a plain object with only the changed fields, not a JSON Patch operation list                                                               |
| `DELETE`        | Delete                                                               | When the endpoint returns 204, type it `void`; when it returns JSON, declare the actual shape; send no request body unless the endpoint requires one |
| `HEAD`          | Only success or failure matters                                      | No response body; the result on success is `undefined`; cannot carry `json` or `body`                                                                |

This handbook's project endpoints are called like this (`id` is the record id, `json` is the request body):

| Operation | Code                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| List      | `api.request<{ data: Project[] }>({ path: 'projects', query: { status: 'active' } })` |
| Get one   | ``api.request<{ data: Project }>({ path: `projects/${id}` })``                        |
| Create    | `api.request<{ data: Project }>({ path: 'projects', method: 'POST', json })`          |
| Update    | ``api.request<{ data: Project }>({ path: `projects/${id}`, method: 'PATCH', json })`` |
| Delete    | ``api.request<void>({ path: `projects/${id}`, method: 'DELETE' })``                   |

- When the id comes from a URL parameter or user input, encode it with `encodeURIComponent` before putting it into `path`.

### Parameters and response bodies

- `path` is relative to the API base URL: **do not** include `/api`, and do not include the deployment base path (such as `/main`).
- `query` holds URL parameters and works with every method. Values can only be strings, numbers, booleans, `null` or arrays of these, not nested objects. A parameter whose value is `undefined` is not sent, `null` is sent as an empty string, and an array is sent as several parameters with the same name. So for "no filter", pass `undefined`.
- `json` is the request body; the client serializes it and sets `Content-Type: application/json`.
- The options are named `query` and `json`, not axios's `params` and `data`.
- `GET` and `HEAD` cannot carry `json` or `body`. Type checking does not catch this, but the browser's fetch throws right away.
- The return value is the response body itself, not a fetch `Response`, and `data` is not unwrapped automatically: when the endpoint returns `{ data: [...] }`, type it `{ data: Project[] }`; when it returns `{ ok: true }`, write `{ ok: boolean }` without adding a `data` layer. The type parameter is only a declaration; nothing is validated at runtime.
- The status code and headers of a successful response are not available; do not read `response.status` or `response.headers`. An empty response (204, `HEAD`) resolves to `undefined`, and a response that is not JSON resolves to text.
- A response that is not 2xx throws `ApiClientError`; see "Error handling".

### File uploads

Pass `FormData` in `body` (`client/pages/projects/upload-attachment.ts`):

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface ProjectAttachment {
  readonly id: number;
  readonly filename: string;
}

/** Assumes the backend provides POST /api/projects/:id/attachments, which accepts a multipart form. */
export async function uploadProjectAttachment(
  api: ApiClient,
  projectId: number,
  file: File,
): Promise<ProjectAttachment> {
  const body = new FormData();
  body.append('file', file);
  // Pass FormData in body; do not also pass json, and do not set Content-Type yourself:
  // the browser generates the multipart type with its boundary.
  const { data } = await api.request<{ data: ProjectAttachment }>({
    path: `projects/${projectId}/attachments`,
    method: 'POST',
    body,
  });
  return data;
}
```

- Use either `json` or `body`, not both. `body` can also be a `Blob`, a string or any other type fetch supports.
- For business attachments (file collections, upload, download, preview), prefer the registered `@nocobase/app-plugin-file`, and read its Skill first. This section only covers sending a file to a custom endpoint.

### Request options

| Option        | Description                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headers`     | Extra request headers; they override defaults with the same name. The client already sends `Accept` and `Accept-Language` (the current UI language) automatically |
| `credentials` | Defaults to `'include'`, so requests carry the sign-in session cookie                                                                                             |
| `signal`      | An `AbortSignal` for canceling the request (see the next section)                                                                                                 |

- Authentication uses the application's existing integration. Having the client does not bypass the server's authentication, authorization or the endpoint's own requirements.

## Loading data in a component

There is no shared data-loading hook; write it directly in the component: `useApiClient()` + `useEffect` + `AbortController`. The component below loads a project by id and displays it, covering loading, retry after failure, record not found, no permission and empty values (`client/pages/projects/project-summary.tsx`):

```tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  if (error instanceof ApiClientError && error.status === 404) {
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
      <div role='status' aria-label={t('status.loading')} className='space-y-3'>
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
          <Badge variant='secondary'>
            {t(`projects.status.${project.status}`)}
          </Badge>
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

Why it is written this way:

1. **No synchronous `setState` in an effect.** The project enables the ESLint rule `@eslint-react/set-state-in-effect`, so a `setLoading(true)` at the start of an effect fails lint. Call `setResult` only in the request's `then` callback.
2. **"Loading" is derived.** Every result carries the `key` of the request that produced it (parameters + reload count). `result.key !== requestKey` means the current request's result has not come back yet. After the parameters change or retry is clicked, the next render is "loading", with no separate `loading` state needed.
3. **Abort the old request.** Call `controller.abort()` in the cleanup: the old request is canceled when the parameters change or the component unmounts. The callbacks check `signal.aborted`, so even if the old request has already returned, its result is discarded and cannot overwrite the new one. A cancellation is not a failure and shows no error.
4. **Keep the old data while reloading.** `project` comes from the previous result and is still there during a reload: the content stays, and only the button shows a `Spinner` (guideline I4). The skeleton is shown only on the first load, when there is no old data (guideline S1).
5. **Rebuild the component with `key` when the record changes.** Once `projectId` changes, the old data belongs to another record and must not be kept. The parent writes `<ProjectSummary key={projectId} projectId={projectId} />`, so switching records clears the state. Route pages work the same way: the page component reads the id from `useParams()`, and the inner component uses it as its `key`.
6. **Check in order**: 404 → 403 → other errors → no data (loading) → data. Errors must be checked before "no data"; otherwise a failure leaves the skeleton showing forever.
7. **Retry**: `reloadCount` goes up by one, `requestKey` changes with it, and the effect runs again. The retry button disappears, so focus moves to a stable place (guideline A6).
8. **Empty values** show "—" (guideline T2.4).

Other points:

- List every dependency: `[api, projectId, reloadCount]`. `useApiClient()` returns the same object every time, so it does not cause repeated requests.
- When loading through a Repository (see "Remote Repository"), the request cannot take a `signal` and cannot be aborted, but still check `controller.signal.aborted` in the callbacks to discard stale results.
- For the complete list page (search conditions written to the URL, empty and no-results states, the `Spinner` in the toolbar while reloading), see `table.md`; for loading the latest data before an edit form opens, see `form.md`; for the detail drawer, see `overlay.md`.

## Error handling

### ApiClientError

When the response is not 2xx, `api.request` throws `ApiClientError`:

| Field           | Contents                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `status`        | The HTTP status code                                                                           |
| `code`          | The business error code, taken from `error.code` or `code` in the response body; may be absent |
| `payload`       | The complete parsed response body, typed `unknown`                                             |
| `requestId`     | The `x-request-id` response header, for matching the error with server logs; may be absent     |
| `method`, `url` | The request method and full URL                                                                |
| `message`       | Taken from the error message the backend returned; **do not show it to users**                 |

- Network errors (offline, server unreachable) and cancellations do not throw `ApiClientError`; they throw fetch's own errors. In `catch`, write `error: unknown`, narrow it with `error instanceof ApiClientError` first, and only then read these fields.
- Handle only the errors you can handle; rethrow the rest for the caller.

### Handling each kind of error

Write the checks directly in the component that uses them (for example `ProjectSummary` above and `CompleteProjectButton` below); do not create an application-wide utility function for this.

| Case                       | Check                                                                    | Handling                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record not found           | `error instanceof ApiClientError && error.status === 404`                | Say the record does not exist or has been deleted, offer a next step (close the overlay, go back to the list) and refresh the list; no retry (guideline R3) |
| No permission              | `error instanceof ApiClientError && error.status === 403`                | Say the user does not have permission; no retry (guideline S4)                                                                                              |
| Business error code        | `error instanceof ApiClientError && error.code === 'PROJECT_NAME_TAKEN'` | Show it below the matching field with `form.setError(...)`; see `form.md`                                                                                   |
| Other (network, 5xx, etc.) | None of the above                                                        | Say "The request failed. Please try again."; when loading data, offer "Retry"                                                                               |

- **Do not show raw messages from the backend**: the text in `error.message` and `payload` may be an English exception, a stack trace or SQL, and must not appear in the UI (guideline I3).
- Error copy goes in the feature's own copy group, for example `projects.error.notFound`, `projects.error.forbidden` and `projects.error.requestFailed`, in both Chinese and English (see `i18n.md`).

## Write operations

A write happens once, when the user clicks, and its state has to be managed too:

| State      | Form                                                                  | Confirmation dialog, single button                                                |
| ---------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Submitting | `form.formState.isSubmitting` (see `form.md`)                         | Keep it in your own `useState` and reset it in `finally`                          |
| Failed     | `form.setError(...)`, shown below the field or at the top of the form | A one-line error in the confirmation dialog; an `error` toast for a single button |

For complete forms, see `form.md`; for the delete confirmation dialog, see `overlay.md`. Below is a single button that marks the project as "Done" when clicked (`client/pages/projects/complete-project-button.tsx`).

```tsx
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
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
}: CompleteProjectButtonProps): ReactElement {
  const { t } = useTranslation();
  // Hooks can only be called at the top level of a component or custom hook, never inside event handlers, conditions or loops.
  const api = useApiClient();
  const toaster = useToaster();
  const [pending, setPending] = useState(false);

  async function complete(): Promise<void> {
    setPending(true);
    try {
      const result = await api.request<{ data: Project }>({
        path: `projects/${project.id}`,
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
      if (error instanceof ApiClientError && error.status === 404) {
        toaster.show({
          type: 'error',
          title: t('projects.error.notFound'),
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

  return (
    <Button
      variant='outline'
      disabled={pending || project.status === 'done'}
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

Handling the outcome:

- **Submitting**: the button shows a `Spinner` and is disabled; dialogs and confirmation dialogs cannot be closed (guidelines T3.5 and S5).
- **Success**: a `success` toast states the result. The current view (detail view, drawer) updates immediately with the data the endpoint returned, and the list refreshes by calling `reload()` (guideline R2); the list's `reload` is passed to child routes through `<Outlet context>` (see `overlay.md`). Do not just call `reload()` and wait for it to come back; in the meantime the UI shows old values.
- **Load the latest data before editing**: request the record by id again and prefill the form with the latest data (guidelines T3.8 and R1). When the backend replaces fields as a whole, saving with stale data overwrites changes that someone else, or you yourself, just made. See `form.md` for how.
- **404 returned**: the record no longer exists. Explain what happened, refresh the list, and offer no "Retry" (guideline R3). A 404 during a delete counts as a successful delete.
- **Other failures**: show the error where the action started (guideline I3) — `form.setError` in a form, one line of error text in a confirmation dialog. Use an `error` toast only for single-click actions without a dialog and for background operations.

## Toasts

Get the toaster with `const toaster = useToaster()` from `@nocobase/app-client` at the top of the component, and call `toaster.show({ type, title })` in event handlers:

| `type`      | Use                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------- |
| `'success'` | The action succeeded; one sentence stating the result                                       |
| `'info'`    | Information, for example that the record to delete has already been deleted by someone else |
| `'error'`   | A single-click action without a dialog, or a background operation, failed                   |

- `description` adds a second line, `action: { label, onClick }` a button that leaves the toast open when clicked, and `duration` how long the toast stays in milliseconds (`0` keeps it open). `show` returns the toast's id, and `toaster.close(id)` closes it.
- The call says what happened, not how it is presented. `client/lib/toaster.ts` decides that for every toast in the application, plugins' included — for example, that a plain-text error is announced to screen readers at once. Call the Base UI `toast` manager in `@/components/ui/toast` directly only for what `show` cannot express, such as `toast.promise`.
- `client/service-provider.ts` registers the toaster service and `client/react-providers.ts` mounts the one `Toaster` component that renders it. Do not mount another `Toaster` yourself.
- Copy goes through translation; when a specific record is involved, include its name (guideline C6), for example `t('projects.complete.success', { name: project.name })`.
- Form validation failures and failed requests inside a dialog do not use a toast; show them in the form or dialog (guideline I3).

## Remote Repository

`api.repository(name)` is also an HTTP call from the frontend; it does not access the database directly. Use it only when the server exposes standard Repository actions with `defineRepositoryApiRoutes`: `name` is the exposed resource name, not an arbitrary table name, and the server decides which actions are exposed, as well as validation, authorization and write policy. For custom endpoints with their own contract (such as the project REST endpoints above), use `request()`.

The following assumes the server has exposed `projects` as a Repository resource (`client/pages/projects/project-repository.ts`):

```ts
import { type ApiClient, buildFindManyOptions } from '@nocobase/app-client';

import type { Project, ProjectStatus } from './types.js';

// Assumes the server exposes projects as a standard Repository resource with defineRepositoryApiRoutes.
// These requests go to paths such as POST /api/projects:findMany, not to the REST endpoints above.

export async function listProjectsByStatus(
  api: ApiClient,
  status: ProjectStatus,
): Promise<Project[]> {
  // The query object findMany returns sends the request only when awaited; the result is already unwrapped from data and is an array.
  return api.repository<Project>('projects').findMany({
    filter: (f) => f.string('status').eq(status),
    sort: (s) => s.field('updatedAt').desc(),
    limit: 50,
  });
}

export async function findProject(
  api: ApiClient,
  id: number,
): Promise<Project | undefined> {
  // Returns undefined when nothing is found; no 404 is thrown.
  return api.repository<Project>('projects').findOne({ filter: { id } });
}

export async function createProject(
  api: ApiClient,
  name: string,
): Promise<Project> {
  const { record } = await api.repository<Project>('projects').createOne({
    values: { name, owner: null, status: 'planning' },
  });
  // createOne and updateOne return { record, ... }; the record is in record.
  return record;
}

export async function renameProject(
  api: ApiClient,
  id: number,
  name: string,
): Promise<Project> {
  const { record } = await api.repository<Project>('projects').updateOne({
    filter: { id },
    values: { name },
  });
  return record;
}

export async function deleteProject(api: ApiClient, id: number): Promise<void> {
  await api.repository<Project>('projects').deleteOne({ filter: { id } });
}

/** Sends the same query manually with request: convert the builder callbacks to JSON first. */
export async function listActiveProjectsByRequest(
  api: ApiClient,
): Promise<Project[]> {
  const { data } = await api.request<{ data: Project[] }>({
    path: 'projects:findMany',
    method: 'POST',
    json: buildFindManyOptions<Project>({
      filter: (f) => f.string('status').eq('active'),
      limit: 50,
    }),
  });
  // request does not unwrap anything; the response body is { data: [...] }.
  return data;
}
```

Every Repository method sends `POST /<name>:<action>` (relative to the API base URL), and its return value is already unwrapped from the response's `data`:

| Method                                    | Returns                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `findMany`                                | A lazy query object; `await` it to get an array                                                            |
| `findOne`                                 | The record, or `undefined` when nothing is found                                                           |
| `createOne`, `updateOne`                  | `{ record, createdTargets, version? }`; the record is in `record`, and the result is not the record itself |
| `deleteOne`                               | `{ deleted: true, record? }`                                                                               |
| `count`, `exists`, `aggregate`, `groupBy` | A count, whether records exist, aggregate results; available only when the server exposes these actions    |

- **`findMany()` is lazy**: it sends the request only on `await`, and yields the complete array; you can also read records one by one as a stream with `for await`. Using `await` on the same query object several times reuses the same Promise and does not send a new request; to query again, call `findMany()` again. The same query cannot be used with both `await` and `for await`, and cannot be iterated twice.
- Set `limit` explicitly on list queries.
- The options are data-operation options, not HTTP options: you cannot pass `signal` or `headers`.
- Options such as `filter` and `sort` accept a builder callback or plain JSON (such as `filter: { id }`). A callback runs locally and synchronously when the method is called, and is sent as JSON; changing the variables the callback uses afterwards does not affect a query already created.
- `request({ json })` does not convert callbacks. To send the same options manually, first convert them to JSON with `buildFindManyOptions` (or a similar function such as `buildFindOneOptions`); see the last function above.

## Verify

- Requests go through the API base URL the application configures, and still work when the application is mounted under a subpath (such as `/main`); the code has no hard-coded `/api` or `/main`, and no `fetch` or axios.
- Request parameters and response types match the server route; the complete response body `request()` returns is kept distinct from the Repository's already unwrapped results.
- Loading and failure states are visible, and 404 and 403 offer no retry; canceled requests and stale responses do not update a view that is already out of date.
- During a write, the button is disabled while submitting; on success the current view updates immediately and the list refreshes; failures are shown where the action started.
- No raw error message from the backend appears in the UI.
- Every read and write endpoint enforces authentication and authorization on the server; checks in the frontend cannot replace that. How to write the server side is outside the scope of this handbook.
