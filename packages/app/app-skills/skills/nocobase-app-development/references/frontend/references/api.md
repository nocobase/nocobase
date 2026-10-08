# Calling backend endpoints

Every endpoint request goes through the HTTP client the application provides:

- **Do not** create your own client, do not use `fetch` or axios, do not hard-code `/api`, and do not build endpoint URLs from `location`. The client's base URL (the configuration key `api.baseURL`, by default `resolveAppUrl('/api')`) already includes the deployment base path (for example `/main`).
- For a URL served by the application, such as an API download `href`, an API-backed image or a page link, use `resolveAppUrl('/api/…')` from `@nocobase/app-client`, which adds the runtime deployment base path. Keep runtime-generated resources, including workflow artifacts, on this helper.
- For a static file shipped in the frontend build, use `resolveAssetUrl('/assets/logo.png')` from `@nocobase/app-client`. Paths are relative to the client output root (`dist/client/assets/logo.png` in this example), with or without a leading slash. The helper uses Vite's absolute HTTP(S) `base` when configured, and otherwise falls back to `resolveAppUrl`; existing absolute, protocol-relative, data and blob URLs are preserved. The templates set `base` from `CDN_BASE_URL` during the build, and Vite writes it into the client code as `import.meta.env.BASE_URL`. Changing CDN settings requires rebuilding and uploading the matching files. Business code should call the helper rather than read the build variable itself.
- Import `useApiClient`, `apiClientToken`, the `ApiClient` type and `ApiClientError` from `@nocobase/app-client`. That way the application and plugins share one runtime and one error class, which is what makes `instanceof ApiClientError` reliable.

## Endpoints and types used in the examples

All code in this handbook comes from the example "projects" domain: `GET` and `POST /api/projects`, `GET`, `PATCH` and `DELETE /api/projects/:id`, with a 409 `ALREADY_EXISTS` error, reason `PROJECT_NAME_TAKEN`, for a duplicate name. They follow the application's HTTP API rules ([`../../http-api.md`](../../http-api.md)): ids are strings, a list answers `{ data, meta }`, and a failure carries a `reason`. The endpoint contract and `client/pages/projects/types.ts` are in [`example/types.md`](example/types.md).

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
  id: string,
  status: ProjectStatus,
) => Promise<Project> {
  // Get the client at the top level of the hook; the returned function can be called from event handlers.
  const api = useApiClient();
  return useCallback(
    async (id: string, status: ProjectStatus) => {
      const { data } = await api.request<{ data: Project }>({
        path: `projects/${encodeURIComponent(id)}`,
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

/** Reports once after the application starts (assumes the backend provides POST /api/clientEvents). */
export class ClientEventsProvider extends ServiceProvider<ClientApplication> {
  // Name a provider after the application's package, as client/service-provider.ts does.
  public readonly name: string = 'my-app/client-events';

  public override start(): Promise<void> {
    // Resolve in methods such as boot() and start(): by then every provider has finished register().
    const api = this.app.services.resolve(apiClientToken);
    // Do not wait for the result; a failure is only logged and does not affect application startup.
    void api
      .request({
        path: 'clientEvents',
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
  id: string,
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
  id: string,
  changes: ProjectChanges,
): Promise<Project> {
  const { data } = await api.request<{ data: Project }, ProjectChanges>({
    path: `projects/${encodeURIComponent(id)}`,
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

| Operation | Code                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------- |
| List      | `api.request<ProjectList>({ path: 'projects', query: { q, status: 'active', page: 1, pageSize: 20 } })`   |
| Get one   | ``api.request<{ data: Project }>({ path: `projects/${encodeURIComponent(id)}` })``                        |
| Create    | `api.request<{ data: Project }>({ path: 'projects', method: 'POST', json })`                              |
| Update    | ``api.request<{ data: Project }>({ path: `projects/${encodeURIComponent(id)}`, method: 'PATCH', json })`` |
| Delete    | ``api.request<void>({ path: `projects/${encodeURIComponent(id)}`, method: 'DELETE' })``                   |

- Encode every id with `encodeURIComponent` before putting it into `path`; ids are strings and may come from a URL parameter or user input.
- A list takes `q` for search, `orderBy` for ordering, and `page` with `pageSize` (20 by default, at most 100), and answers `{ data, meta: { page, pageSize, total } }`, typed `ProjectList` in [`example/types.md`](example/types.md). A feed or log pages with `pageSize` and `pageToken` instead, and its `meta` carries `nextPageToken` until the last page.

### Parameters and response bodies

- `path` is relative to the API base URL: **do not** include `/api`, and do not include the deployment base path (such as `/main`).
- `query` holds URL parameters and works with every method. Values can only be strings, numbers, booleans, `null` or arrays of these, not nested objects. A parameter whose value is `undefined` is not sent, `null` is sent as an empty string, and an array is sent as several parameters with the same name. So for "no filter", pass `undefined`.
- `json` is the request body; the client serializes it and sets `Content-Type: application/json`.
- The options are named `query` and `json`, not axios's `params` and `data`.
- `GET` and `HEAD` cannot carry `json` or `body`. Type checking does not catch this, but the browser's fetch throws right away.
- The return value is the response body itself, not a fetch `Response`, and `data` is not unwrapped automatically: when the endpoint returns `{ data: Project }`, type it `{ data: Project }`; a list returns `{ data: [...], meta }`, so type both, such as `ProjectList`. An endpoint that answers `204` resolves to `undefined`; type it `void`. The type parameter is only a declaration; nothing is validated at runtime.
- The status code and headers of a successful response are not available; do not read `response.status` or `response.headers`. An empty response (204, `HEAD`) resolves to `undefined`, and a response that is not JSON resolves to text.
- A response that is not 2xx throws `ApiClientError`; see "Error handling".

### File uploads

Pass `FormData` in `body` (`client/pages/projects/upload-attachment.ts`):

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface ProjectAttachment {
  readonly id: string;
  readonly filename: string;
}

/** Assumes the backend provides POST /api/projects/:id/attachments, which accepts a multipart form. */
export async function uploadProjectAttachment(
  api: ApiClient,
  projectId: string,
  file: File,
): Promise<ProjectAttachment> {
  const body = new FormData();
  body.append('file', file);
  // Pass FormData in body; do not also pass json, and do not set Content-Type yourself:
  // the browser generates the multipart type with its boundary.
  const { data } = await api.request<{ data: ProjectAttachment }>({
    path: `projects/${encodeURIComponent(projectId)}/attachments`,
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

Data reloads when the user acts (a search, "Retry", a refresh button) or after the page's own writes. Pushing server changes to open pages needs server-side events as well; `@nocobase/app-client` exports `realtimeClientToken`, and the one realtime feature the template ships, the in-app inbox, is documented in the `nocobase-app-plugin-notification-in-app` Skill. Read it before building live updates.

There is no shared data-loading hook; write it directly in the component: `useApiClient()` + `useEffect` + `AbortController`. Do not reach for the data hooks of the installed Refine packages (`useList`, `useTable`, `useForm` from `@refinedev/*`) or for TanStack Query: the application registers no Refine data provider, so those hooks have nothing to call, and one loading pattern across pages keeps states and errors consistent. The application shell mounts Refine and `client/service-provider.ts` can register Refine resources, which only describe records to code that opts into Refine; without a data provider they load nothing, and they never add menu entries. Add a data provider only when the user asks to adopt Refine's data hooks across the application. The component below loads a project by id and displays it, covering loading, retry after failure, record not found, no permission and empty values (`client/pages/projects/project-summary.tsx`):

```tsx
// client/pages/projects/project-summary.tsx (excerpt; the complete file is in example/project-summary.md)
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

  // … reload(), the four states and the card: example/project-summary.md
}
```

Why it is written this way:

1. **No synchronous `setState` in an effect.** A `setLoading(true)` at the start of an effect fails lint (`react-hooks/set-state-in-effect`). Call `setResult` only in the request's `then` callback.
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
- For the complete list page (search conditions written to the URL, empty and no-results states, the `Spinner` in the toolbar while reloading), see [`table.md`](table.md) and [`example/list-page.md`](example/list-page.md); for loading the latest data before an edit form opens, see [`form.md`](form.md); for the detail drawer, see [`overlay.md`](overlay.md).

## Error handling

### ApiClientError

When the response is not 2xx, `api.request` throws `ApiClientError`:

| Field           | Contents                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| `status`        | The HTTP status code                                                                       |
| `reason`        | The error reason from the standard error body, such as `PROJECT_NAME_TAKEN`; may be absent |
| `domain`        | Who defined `reason`, such as `projects` or `app`; may be absent                           |
| `payload`       | The complete parsed response body, typed `unknown`                                         |
| `requestId`     | The request's id, for matching the error with server logs; may be absent                   |
| `method`, `url` | The request method and full URL                                                            |
| `message`       | Taken from the error message the backend returned; **do not show it to users**             |

- Network errors (offline, server unreachable) and cancellations do not throw `ApiClientError`; they throw fetch's own errors. In `catch`, write `error: unknown`, narrow it with `error instanceof ApiClientError` first, and only then read these fields.
- Handle only the errors you can handle; rethrow the rest for the caller.

### Handling each kind of error

Write the checks directly in the component that uses them (for example `ProjectSummary` above and `CompleteProjectButton` below); extract them only when several pages share them (["Basic conventions" in `../frontend-dev.md`](../frontend-dev.md#basic-conventions)).

| Case                       | Check                                                                                            | Handling                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session ended              | `error instanceof ApiClientError && error.status === 401`                                        | The session expired or was revoked: no Retry; offer "Sign in again" where the error shows (below the table)                                                 |
| Record not found           | `error instanceof ApiClientError && error.status === 404`                                        | Say the record does not exist or has been deleted, offer a next step (close the overlay, go back to the list) and refresh the list; no retry (guideline R3) |
| No permission              | `error instanceof ApiClientError && error.status === 403`                                        | Say the user does not have permission; no retry (guideline S4)                                                                                              |
| Business error reason      | `error instanceof ApiClientError && error.reason === 'PROJECT_NAME_TAKEN'`                       | Show it below the matching field with `form.setError(...)`; see [`form.md`](form.md)                                                                        |
| Conflict                   | `error instanceof ApiClientError && error.status === 409 && error.reason === 'VERSION_CONFLICT'` | Keep the input and offer "Load latest", not Retry (below the table)                                                                                         |
| Other (network, 5xx, etc.) | None of the above                                                                                | Say "The request failed. Please try again."; when loading data, offer "Retry"                                                                               |

- **Conflict (409)**: a write the server rejects because the record changed after it was loaded (reason `VERSION_CONFLICT` from a Repository write, or your endpoint's own conflict reason). Keep the input, say that someone else changed the record, and offer "Load latest" (reload the record, then let the user reapply the change) rather than "Retry", which would fail again (guideline R1).
- **Session ended (401)**: a loader, form or dialog renders `SessionExpiredAlert` ([`example/session-expired-alert.md`](example/session-expired-alert.md)); a single-click write puts the same button in the toast's `action`. The button calls `refresh()` from `useAuthentication()` (`@nocobase/app-plugin-authentication/client`). While it runs, `AuthenticationGuard` renders nothing, so the signed-in pages and their input unmount, and `RequiredAuthentication` then sends the user to sign in. That is why the user starts it: never call `refresh()` from an effect or a `catch` on your own.
- **Do not show raw messages from the backend**: the text in `error.message` and `payload` may be an English exception, a stack trace or SQL, and must not appear in the UI (guideline I3).
- Error copy goes in the feature's own copy group, for example `projects.error.notFound`, `projects.error.forbidden` and `projects.error.requestFailed`, in both Chinese and English (see [`i18n.md`](i18n.md)).

## Write operations

A write happens once, when the user clicks, and its state has to be managed too:

| State      | Form                                                                  | Confirmation dialog, single button                                                |
| ---------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Submitting | `form.formState.isSubmitting` (see [`form.md`](form.md))              | Keep it in your own `useState` and reset it in `finally`                          |
| Failed     | `form.setError(...)`, shown below the field or at the top of the form | A one-line error in the confirmation dialog; an `error` toast for a single button |

For complete forms, see [`form.md`](form.md); for the delete confirmation dialog, see [`overlay.md`](overlay.md). Below is a single button that marks the project as "Done" when clicked (`client/pages/projects/complete-project-button.tsx`).

Its complete code is [`example/complete-button.md`](example/complete-button.md): `pending` state reset in `finally`, a success toast with the record name, `onCompleted` with the returned record, and error toasts that tell 404, 403 and other failures apart.

Handling the outcome:

- **Submitting**: the button shows a `Spinner` and is disabled; dialogs and confirmation dialogs cannot be closed (guidelines T3.5 and S5).
- **Success**: a `success` toast states the result. The current view (detail view, drawer) updates immediately with the data the endpoint returned, and the list refreshes by calling `reload()` (guideline R2); the list's `reload` is passed to child routes through `<Outlet context>` (see [`overlay.md`](overlay.md)). Do not just call `reload()` and wait for it to come back; in the meantime the UI shows old values.
- **Load the latest data before editing**: request the record by id again and prefill the form with the latest data (guidelines T3.8 and R1). When the backend replaces fields as a whole, saving with stale data overwrites changes that someone else, or you yourself, just made. See [`form.md`](form.md) for how.
- **404 returned**: the record no longer exists. Explain what happened, refresh the list, and offer no "Retry" (guideline R3). A 404 during a delete counts as a successful delete.
- **Other failures**: show the error where the action started (guideline I3) — `form.setError` in a form, one line of error text in a confirmation dialog. Use an `error` toast only for single-click actions without a dialog and for background operations.

## Toasts

Get the toaster with `const toaster = useToaster()` from `@nocobase/app-client` at the top of the component, and call `toaster.show({ type, title })` in event handlers:

| `type`      | Use                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'success'` | The action succeeded; one sentence stating the result                                                                                              |
| `'info'`    | Information, for example that the record to delete has already been deleted by someone else                                                        |
| `'error'`   | A single-click action without a dialog, or a background operation, failed                                                                          |
| `'warning'` | Something succeeded with a caveat the user should know about                                                                                       |
| `'loading'` | A background operation is running and never closes by itself: `show` returns an id, and a second `show` with that `id` replaces it with the result |

- `description` adds a second line, `action: { label, onClick }` a button that leaves the toast open when clicked, and `duration` how long the toast stays in milliseconds (`0` keeps it open). `show` returns the toast's id, and `toaster.close(id)` closes it.
- The call says what happened, not how it is presented. `client/lib/toaster.ts` decides that for every toast in the application, plugins' included — for example, that a plain-text error is announced to screen readers at once. Call the Base UI `toast` manager in `@/components/ui/toast` directly only for what `show` cannot express, such as `toast.promise`.
- `client/service-provider.ts` registers the toaster service and `client/react-providers.ts` mounts the one `Toaster` component that renders it. Do not mount another `Toaster` yourself ([section 6 of `styling.md`](styling.md#6-toasts) explains the shell's part).
- Copy goes through translation; when a specific record is involved, include its name (guideline C6), for example `t('projects.complete.success', { name: project.name })`.
- Form validation failures and failed requests inside a dialog do not use a toast; show them in the form or dialog (guideline I3).

## Remote Repository

`api.repository(name)` is also an HTTP call from the frontend; it does not access the database directly. Use it only when the server exposes standard Repository actions with `defineRepositoryApiRoutes`: `name` is the exposed resource name, not an arbitrary table name, and the server decides which actions are exposed, as well as validation, authorization and write policy. For custom endpoints with their own contract (such as the project REST endpoints above), use `request()`.

The following assumes the server has exposed the projects Collection as a Repository resource named `projectRecords` (`client/pages/projects/project-repository.ts`). The name is the first path segment of every data endpoint, so it is a camelCase word that no REST route uses; naming it `projects` would put its endpoints beside `/api/projects/:id`.

```ts
import { type ApiClient, buildFindManyOptions } from '@nocobase/app-client';

import type { Project, ProjectStatus } from './types.js';

// Assumes the server exposes the projects Collection as projectRecords with defineRepositoryApiRoutes.
// These requests go to paths such as POST /api/projectRecords/findMany, not to the REST endpoints above.

export async function listProjectsByStatus(
  api: ApiClient,
  status: ProjectStatus,
): Promise<Project[]> {
  // The query object findMany returns sends the request only when awaited; the result is already unwrapped from data and is an array.
  return api.repository<Project>('projectRecords').findMany({
    filter: (f) => f.string('status').eq(status),
    sort: (s) => s.field('updatedAt').desc(),
    limit: 50,
  });
}

export async function findProject(
  api: ApiClient,
  id: string,
): Promise<Project | undefined> {
  // Returns undefined when nothing is found; no 404 is thrown.
  return api.repository<Project>('projectRecords').findOne({ filter: { id } });
}

export async function createProject(
  api: ApiClient,
  name: string,
): Promise<Project> {
  const { record } = await api.repository<Project>('projectRecords').createOne({
    values: { name, owner: null, status: 'planning' },
  });
  // createOne and updateOne return { record, ... }; the record is in record.
  return record;
}

export async function renameProject(
  api: ApiClient,
  id: string,
  name: string,
): Promise<Project> {
  const { record } = await api.repository<Project>('projectRecords').updateOne({
    filter: { id },
    values: { name },
  });
  return record;
}

export async function deleteProject(api: ApiClient, id: string): Promise<void> {
  await api.repository<Project>('projectRecords').deleteOne({ filter: { id } });
}

/** Sends the same query manually with request: convert the builder callbacks to JSON first. */
export async function listActiveProjectsByRequest(
  api: ApiClient,
): Promise<Project[]> {
  const { data } = await api.request<{ data: Project[] }>({
    path: 'projectRecords/findMany',
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

Every Repository method sends `POST /{name}/{action}` (relative to the API base URL), and its return value is already unwrapped from the response's `data`:

| Method                                    | Returns                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `findMany`                                | A lazy query object; `await` it to get an array                                                            |
| `findOne`                                 | The record, or `undefined` when nothing is found                                                           |
| `createOne`, `updateOne`                  | `{ record, createdTargets, version? }`; the record is in `record`, and the result is not the record itself |
| `deleteOne`                               | `{ deleted: true, record? }`                                                                               |
| `count`, `exists`, `aggregate`, `groupBy` | A count, whether records exist, aggregate results; available only when the server exposes these actions    |

- **`findMany()` is lazy**: it sends the request only on `await`, and yields the complete array; you can also read records one by one as a stream with `for await`. Using `await` on the same query object several times reuses the same Promise and does not send a new request; to query again, call `findMany()` again. The same query cannot be used with both `await` and `for await`, and cannot be iterated twice.
- Set `limit` explicitly on list queries.
- For a collection with optimistic locking (`optimisticLock('<field>')` in its migration), pass the lock field's value from the loaded record as `ifVersion` to `updateOne` or `deleteOne`; the result's `version` is the new value. A write against a record changed since then fails with 409 `VERSION_CONFLICT` ("Conflict (409)" above).
- The options are data-operation options, not HTTP options: you cannot pass `signal` or `headers`.
- Options such as `filter` and `sort` accept a builder callback or plain JSON (such as `filter: { id }`). A callback runs locally and synchronously when the method is called, and is sent as JSON; changing the variables the callback uses afterwards does not affect a query already created.
- `request({ json })` does not convert callbacks. To send `findMany` options manually, first convert them to JSON with `buildFindManyOptions`, the only builder `@nocobase/app-client` exports (see the last function above); for every other action, call the Repository method instead of `request()`.

## Verify

- Requests go through the API base URL the application configures, and still work when the application is mounted under a subpath (such as `/main`); the code has no hard-coded `/api` or `/main`, and no `fetch` or axios.
- Request parameters and response types match the server route; the complete response body `request()` returns is kept distinct from the Repository's already unwrapped results.
- Loading and failure states are visible, and 404 and 403 offer no retry; canceled requests and stale responses do not update a view that is already out of date.
- During a write, the button is disabled while submitting; on success the current view updates immediately and the list refreshes; failures are shown where the action started.
- No raw error message from the backend appears in the UI.
- Every read and write endpoint enforces authentication and authorization on the server; checks in the frontend cannot replace that. How to write the server side is outside the scope of this handbook.
