# Calling backend endpoints

Every request goes through the HTTP client the application provides. Import `useApiClient`, `apiClientToken`, the `ApiClient` type and `ApiClientError` from `@nocobase/app-client`, so the application and plugins share one client and one error class (`instanceof ApiClientError` is reliable).

- Never create a client, use `fetch` or axios, hard-code `/api`, or build endpoint URLs from `location`. The client's base URL (`api.baseURL`, by default `resolveAppUrl('/api')`) already includes the deployment base path.
- For an application URL outside `request()` — a download `href`, an API-backed image — use `resolveAppUrl('/api/…')`. For a static file of the frontend build, use `resolveAssetUrl('/assets/logo.png')`, which follows Vite's `base` (`CDN_BASE_URL` at build time) and otherwise `resolveAppUrl`. Both come from `@nocobase/app-client`.

The examples use the "projects" domain: `GET`/`POST /api/projects`, `GET`/`PATCH`/`DELETE /api/projects/:id`, a 409 `ALREADY_EXISTS` with reason `PROJECT_NAME_TAKEN` for a duplicate name. They follow [`../../http-api.md`](../../http-api.md): ids are strings, a list answers `{ data, meta }`, a failure carries a `reason`. Types are in [`example/types.md`](example/types.md).

## Getting the client

- **Components and hooks**: `const api = useApiClient()` at the top level (the same as `useService(apiClientToken)`); use `api` in handlers and effects. It only works below `AppClientRoot`, returns the same object every time, and manages no request state.
- **A client ServiceProvider**: `this.app.services.resolve(apiClientToken)` in `boot()` or `start()`, never in `register()`, a constructor or at module top level. A rejected `start()` stops the application, so never await a request it can do without, and catch its failure.
- **Plain functions** take the client as a parameter typed `ApiClient`; a request several components of a page share goes in such a function in the page folder:

```ts
// client/pages/projects/project-api.ts
export async function updateProject(
  api: ApiClient,
  id: string,
  changes: ProjectChanges,
): Promise<Project> {
  const { data } = await api.request<{ data: Project }, ProjectChanges>({
    path: `projects/${encodeURIComponent(id)}`,
    method: 'PATCH',
    json: changes, // the second type parameter types `json`
  });
  return data;
}
```

## Calling an endpoint

`api.request(options)` sends one request and returns the parsed response body.

| Operation | Code                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------- |
| List      | `api.request<ProjectList>({ path: 'projects', query: { q, status, page: 1, pageSize: 20 } })`             |
| Get one   | ``api.request<{ data: Project }>({ path: `projects/${encodeURIComponent(id)}` })``                        |
| Create    | `api.request<{ data: Project }>({ path: 'projects', method: 'POST', json })`                              |
| Update    | ``api.request<{ data: Project }>({ path: `projects/${encodeURIComponent(id)}`, method: 'PATCH', json })`` |
| Delete    | ``api.request<void>({ path: `projects/${encodeURIComponent(id)}`, method: 'DELETE' })``                   |

- `method` is `GET` (default), `POST`, `PUT`, `PATCH`, `DELETE` or `HEAD`. `PATCH` sends only the changed fields as a plain object; `PUT` replaces, so send every writable field. `GET` and `HEAD` cannot carry `json` or `body`: fetch throws, the types do not catch it.
- `path` is relative to the API base: no `/api`, no `/main`. Encode every id with `encodeURIComponent`.
- `query` values are strings, numbers, booleans, `null` or arrays of them: `undefined` is not sent (use it for "no filter"), `null` is sent empty, an array repeats the name. The options are `query` and `json`, not axios's `params` and `data`.
- The result is the body itself, nothing unwrapped: type `{ data: Project }`, a list as `{ data, meta }`. `204` and `HEAD` resolve to `undefined` (type `void`); non-JSON resolves to text. Status and headers of a success are not available. The type parameter validates nothing at runtime.
- A list takes `q`, `orderBy`, `page` and `pageSize` (default 20, at most 100) and answers `{ data, meta: { page, pageSize, total } }`; a feed pages with `pageToken`, its `meta` carrying `nextPageToken`.
- Read row summaries from the list response or one batch request for the visible ids, never a request per row ([server routes](../../server-routes.md#lists-and-statistics-a-fixed-number-of-queries)).
- Other options: `headers`, `credentials` (default `'include'`) and `signal`.
- **Uploads**: pass `FormData` in `body`, never with `json` and without setting `Content-Type`. For business attachments use `@nocobase/app-plugin-file` and its Skill.

## Loading data in a component

Read lists and single records with `useListData` (`#hooks/use-list-data`): one pattern across pages keeps states, stale responses and refreshes consistent. Do not reach for TanStack Query or a hand-written `useEffect` loader in a page. Lists add URL state as [`table.md`](table.md) describes.

```tsx
// client/pages/projects/detail/index.tsx (excerpt)
const { projectId = '' } = useParams();
const request = useListData<{ data: Project }>(
  `projects/${encodeURIComponent(projectId)}`,
  { scopes: [projectScope(projectId)] }, // announced writes update it (data-changes.md)
);
const status =
  request.error instanceof ApiClientError ? request.error.status : undefined;
if (status === 404) return <NotFound />; // no Retry (guideline R3)
if (status === 403) return <Forbidden />; // no Retry (guideline S4)
if (status === 401) return <SessionEnded />; // "Sign in again", no Retry
if (request.error) return <LoadFailed onRetry={request.reload} />;
if (!request.data) return <DetailSkeleton />;
return <ProjectFields project={request.data.data} />;
```

- `useListData(path, options)` returns `{ data, error, loading, revision, reload, replaceData, path }`. A result belongs to the path and read that produced it: a changed path aborts the old read and drops its data (unless `keepPreviousData`), and late responses are discarded, so an old record never shows under a new id.
- Check errors before "no data", or a failure leaves the skeleton forever. A reload of the same path keeps the shown data; show a `Spinner` on the button, and the skeleton only on the first load (guidelines I4, S1). Empty values show "—".
- `active: false` (from `useListLocation`, while a child route covers the view) keeps the data and defers reads until the view is shown again.
- `scopes` declares what the view reads; after a write, views update only through `announceDataChange` ([`data-changes.md`](data-changes.md)). `reload` is for the user's Retry, never for refreshing after a write.
- Retention: a same-query refresh keeps still-authorized content; a changed query clears the result area or marks the retained rows as previous results. A user, tenant or permission change discards protected data and drafts, even if that means unmounting. Retention never bypasses a 401 or 403.

## Keeping lists and charts live

Changes made in another tab or by another user arrive through realtime topics when the business needs them. Read the installed `nocobase-realtime` Skill in `.agents/skills/` first. Declare the server Topic during provider boot and reuse the host client through `useRealtimeTopic` or `useRealtimeRefresh` from `@nocobase/app-client`; a watch's `onReady` runs after the Topic is acknowledged, reconnects included, so refresh authoritative data then (disconnected events are not replayed). Pass `enabled: false` for inactive pages. Lower-level code resolves `realtimeClientToken` and calls `watch(topic, { onEvent, onReady, onError })`, closing the handle on cleanup. TanStack Query snapshots use `refreshRealtimeQueries(queryClient, filters, signal)`, not bare `invalidateQueries`.

When events refresh what a page shows:

- An event that names items refreshes those items: gather the ids of a burst (a few hundred milliseconds), read only those rows, keep one such request in flight, and merge the answer. A `name` change refreshes the row, not a status chart. Read the whole list again only when membership changed or the event names nothing.
- Recompute a chart at most every few seconds while visible, or only the figure the event affects.
- Read nothing while the page is hidden (`document.visibilityState`, or a page not shown); read once when it is shown again.
- A component needing one small fact reads the small endpoint that answers it, especially in components mounted on every page (navigation, header badges).
- Keep subscriptions in one place (the page or a hook it owns), never one per row, and subscribe only to topics the page shows.
- When a refresh is triggered while a read of the same data is in flight, let it finish and read once more, rather than aborting it again and again. Build request keys only from the parameters that decide the data.

Test an event-driven cycle with a request spy and an explicit completion signal, excluding the initial load, and assert an upper bound on reads per event (`expect(refreshRequests.length).toBeLessThanOrEqual(1)`), not merely that a request happened. The server side is [server routes](../../server-routes.md#frequently-called-endpoints).

## Error handling

A non-2xx response throws `ApiClientError` with `status`, `reason` (such as `PROJECT_NAME_TAKEN`), `domain`, `payload` (the parsed body), `requestId`, `method`, `url` and `message`. Network errors and cancellations throw fetch's own errors. Catch `error: unknown`, narrow with `instanceof ApiClientError`, handle what you can and rethrow the rest. Never show `message` or `payload`, which may be an exception, a stack trace or SQL (guideline I3).

### Handling each kind of error

- `401`: no Retry; offer "Sign in again". `403`: say so, no Retry (S4).
- `404`: say the record no longer exists, offer a next step (close, back to the list) and announce its scope; no Retry (R3). On delete it counts as success.
- `400`: say which input to correct and keep it. A business `reason` such as `PROJECT_NAME_TAKEN`: `form.setError` on its field ([`form.md`](form.md)).
- `409` with `VERSION_CONFLICT`: keep the input, say someone changed the record, offer "Load latest" rather than Retry (R1).
- Anything else (network, 5xx): "The request failed. Please try again.", with Retry when loading.
- **Session ended**: show a translated alert with a "Sign in again" button, or put that button in the toast's `action` for a single-click write. The button calls `refresh()` from `useAuthentication()` (`@nocobase/app-plugin-authentication/client`), which unmounts the signed-in pages and sends the user to sign in, so only the user starts it, never an effect or a `catch`.
- Error copy lives in the feature's copy group (`projects.error.notFound`) in every locale ([`i18n.md`](i18n.md)).

## Write operations

A write runs once, when the user acts. Protect it from duplicates with `useSubmission` ([submission protection](../../submission.md)), then:

- **Submitting**: the button shows a `Spinner` and is disabled; a dialog cannot close (T3.5). In a form that is `form.formState.isSubmitting` or the submission's `submitting`.
- **Success**: a `success` toast states the result. Announce the change once with `announceDataChange({ scopes, results })` from `#hooks/use-data-changes`: the open view takes the returned record at once and related lists and counts read again ([`data-changes.md`](data-changes.md), guideline R2).
- **Before editing**, load the record by id again and prefill from that (T3.8, R1) ([`form.md`](form.md)).
- **Failure**: show it where the action started (I3): `form.setError` in a form, one line in a confirmation dialog, an `error` toast only for a single-click action or a background operation. An unknown outcome (network failure, 5xx) announces the scopes without results, so views read what actually happened.
- The delete confirmation is in [`overlay.md`](overlay.md); a complete create and edit is [`executable-list-edit.md`](executable-list-edit.md).

## Toasts

`const toaster = useToaster()` (`@nocobase/app-client`) at the top level, then `toaster.show({ type, title })` in handlers. `type` is `'success'` (one sentence stating the result, naming the record: `t('projects.complete.success', { name })`), `'info'`, `'warning'`, `'error'` (single-click actions and background operations only) or `'loading'` (stays open; `show` again with its `id` to replace it). `description` adds a line, `action: { label, onClick }` a button, `duration` the lifetime in ms (`0` keeps it), and `toaster.close(id)` closes one. `client/lib/toaster.ts` decides presentation and the application mounts the only `Toaster` ([section 6 of `styling.md`](styling.md#6-toasts)); never mount another. Validation errors and failures inside a dialog are not toasts.

## Remote Repository

`api.repository(name)` calls the standard Repository actions a server exposes with `defineRepositoryApiRoutes`, as `POST /{name}/{action}`; `name` is the exposed resource (a camelCase name no REST route uses, such as `projectRecords`), not a table. For custom endpoints use `request()`.

```ts
const projects = await api.repository<Project>('projectRecords').findMany({
  filter: (f) => f.string('status').eq(status),
  sort: (s) => s.field('updatedAt').desc(),
  limit: 50,
});
const { record } = await api.repository<Project>('projectRecords').updateOne({
  filter: { id },
  values: { name },
  ifVersion: loadedVersion, // the lock field read with the record; 409 VERSION_CONFLICT when stale
  idempotencyKey: key, // from useSubmission
});
```

- Results are unwrapped: `findMany` is a lazy query (`await` it for an array, or `for await` to stream; awaiting twice reuses one request, so call `findMany()` again to re-query); `findOne` returns the record or `undefined`, no 404; `createOne`/`updateOne` return `{ record, createdTargets, version? }`; `deleteOne` returns `{ deleted: true, record? }`; `count`, `exists`, `aggregate` and `groupBy` exist when the server exposes them.
- Set `limit` on list queries. Writes take `idempotencyKey` and `signal`; reads take no `signal` or `headers`, so discard their stale results yourself.
- `filter` and `sort` accept a builder callback, run once when the method is called, or plain JSON. To send `findMany` options through `request()`, convert them with `buildFindManyOptions`; for other actions call the Repository method.

## Verify

- No hard-coded `/api` or `/main`, no `fetch` or axios; requests work under a subpath.
- Parameters and response types match the server route; `request()` bodies are not confused with unwrapped Repository results.
- Loading and failure are visible, 401, 403 and 404 offer no Retry, and stale responses never update a newer view.
- A write disables its button while submitting, updates the open view and the affected lists through scopes, and shows failures where it started; no raw backend message reaches the UI.
- Every endpoint authenticates and authorizes on the server; the frontend never replaces that.
