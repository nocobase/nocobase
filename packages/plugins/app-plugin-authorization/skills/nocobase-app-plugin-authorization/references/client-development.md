# Client routes, action visibility and record eligibility

The sales workflow has three independent pages: Projects, Quotes and Orders. Delivery specialists enter Orders without gaining entry to Projects or Quotes. Declare `authz` on every entry page; nothing is inferred from the route name. A page that needs only sign-in, such as an overview, declares `authz: 'skip'`; business pages never do.

## Register the runtime first

Register the main authorization client factory and server plugin alongside authentication. The authorization React provider depends on the authentication provider; retain their normal composition order. A package dependency alone does not activate either side. Optional rule plugins require their owning installed Skills; follow [capability discovery](optional-capabilities.md) before using them. See [runtime setup](runtime-api.md).

Application-owned pages belong in the App's `client/routes.ts` and page modules. A reusable plugin contributes routes through its client declaration. Use stable page ids that match the permission-set page grant:

```ts
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export default defineAppRoutes([
  {
    name: 'sales-quotes',
    path: '/sales/quotes',
    auth: 'required',
    navigation: { title: 'sales.quotes' },
    authz: { resource: { type: 'page', id: 'sales.quotes' }, action: 'access' },
    componentLoader: () => import('./pages/quotes-page.js'),
  },
]);
```

The page module default-exports a React component. Translate the navigation key in its owning namespace. Paths omit the deployment base path. Declare `authz` on the first page of every path. A nested page that omits it inherits its nearest ancestor page's value, and a child's own value overrides it. A first page that omits it still registers, with a development warning, but defaults to `'unrestricted'` on a protected App page or a settings page, which only identities with unrestricted access such as root may open or see, and to `'skip'` on a guest, optional or dev page; always declare it rather than rely on that. Declare `'skip'` for a page that needs no check beyond sign-in, and remember that `'skip'` does not bypass parent guards. `'unrestricted'` may also be declared for a root-only page; nothing grants it, so it is never listed in the permission workspace. The permission workspace lists every route whose `authz` checks `page` `access`, under the Pages entry with its navigation groups as resource groups, from the client route tree in menu order; there is no server page registration. `authz.pages.grant('sales.quotes')` builds the matching grant for seeds and provisioning. Composites and settings items are listed under the subsections the server places them in with `authz.ui.place` (subsections are added with `authz.ui.sections.add`), or under their default section's "Other". A page grant opens an entry; business data needs its own action grants, and renaming a page id orphans the grants that reference it.

## Check feature visibility

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';

const permission = useCan({
  resource: { type: 'composite', id: 'sales.quotes' },
  action: 'submit',
});
// permission: { can, isPending, error, retry }
```

Call Hooks inside a component or custom Hook. While pending or failed, `can` is false; show a loading state or retryable permission error without exposing stale actions. `{ enabled: false }` as the second argument skips a check. `useCan('unrestricted')` passes only for an identity whose snapshot is unrestricted, such as root; route guards and menus use it for `authz: 'unrestricted'` pages. Never call Hooks conditionally. A successful check means the feature is granted, not that a particular quote can be submitted.

React code can obtain the shared client with `useAuthorizationClient()`. Outside React, resolve `authorizationClientToken` from the App container and call `client.can({ resource, action })`, or `client.can('unrestricted')` to ask whether the identity has unrestricted access. `useAuthorizationRevision()` supports custom state that must reload on invalidation. Avoid a module-global client or permission response surviving an identity change. The standard provider and `useCan` already handle session invalidation; do not duplicate snapshot caching. After a change that affects permissions, call `client.invalidate()` so the next check reloads `snapshot()`.

## Obtain row eligibility from the server

The sales list endpoints return per-record allowed operations; the client combines this with feature visibility. On the server, compute submission eligibility from the same declared action policies: required quote read/write fields, quote scope, actual parent-project scope, positive amount and draft status. Check all required scopes; merely seeing the row through View does not prove Submit.

Do not implement a parallel role-to-button matrix or infer permissions from role names. Never download all rows and filter them locally. Eligibility is a UI hint and can become stale; the mutation endpoint must authorize and validate again.

```tsx
import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useState } from 'react';

export function SubmitQuote({
  quote,
  reload,
}: {
  quote: { id: string; canSubmit: boolean };
  reload: () => Promise<void>;
}) {
  const api = useApiClient();
  const access = useCan({
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'submit',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  if (access.isPending) return <span>Checking access…</span>;
  if (access.error)
    return (
      <button onClick={() => void access.retry()}>
        Retry permission check
      </button>
    );
  if (!access.can) return null;
  return (
    <>
      <button
        disabled={!quote.canSubmit || pending}
        onClick={async () => {
          setPending(true);
          setError(undefined);
          try {
            await api.request({
              path: `sales/quotes/${encodeURIComponent(quote.id)}/submit`,
              method: 'POST',
            });
            await reload();
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : 'Submission failed',
            );
          } finally {
            setPending(false);
          }
        }}
      >
        Submit
      </button>
      {error && <p role='alert'>{error}</p>}
    </>
  );
}
```

This component illustrates a customer-owned endpoint and a `canSubmit` response field that its server must implement. Replace the minimal button/status markup with App UI primitives and translation keys in production. `api.request` uses `path`, `method`, `query` and `json`; it returns the parsed response body. Do not repeat `/api` or the deployment mount, construct a second API client, or import server registration modules into the client bundle to obtain a resource name. Share small browser-safe identifiers when needed.

After a write, reload affected records and relationship controls, preserve the current selected order where possible, and recompute eligibility. For stale state, forbidden and validation responses, display the server outcome and refresh relevant data; never force the optimistic state to remain submitted after rejection. No client flag can replace server enforcement.

## Delivery relation controls

The order relation endpoint returns existing relations, permitted relation operations and target options derived from the `manageRelations` policy. Offer only allowed create/update/upsert/connect/disconnect/set/delete controls. Existing relation reads use the View policy; mutation eligibility also requires an eligible order and business state. Carrier options come from the relation target scope, for example active carriers. They do not use the authorization-management subject picker.

Request bodies for an App-owned `POST sales/orders/:id/relations` endpoint look like:

```json
{ "carrier": { "connect": { "id": "express" } } }
```

```json
{
  "checks": {
    "update": [{ "filter": { "id": "check-1" }, "values": { "done": true } }]
  }
}
```

```json
{
  "collaborators": {
    "connect": [
      { "where": { "id": "freight" }, "through": { "note": "Review" } }
    ]
  }
}
```

These are sample ids; fetch actual options from the endpoint. Never expose protected foreign keys or internal join fields as a shortcut around a denied relation operation. A rejected nested mutation must leave the whole write rolled back.

## Settings screens

A settings screen is an ordinary application page: declare it among the App's own routes in `client/routes.ts` with `defineAppRoutes`, a lazy page module, navigation keys and `authz: { resource: { type: 'settings', id }, action: 'read' }` naming a settings item registered on the server with `authz.settings.add`. Declare `authz` on every such entry page: one that omits it defaults to `'unrestricted'`, which only root may open. Check read and each write action separately in the endpoints. Plugins contribute no settings screens, and the authorization plugins ship no permission-set or rule editors; an App that needs one builds it on the management HTTP API.

For a new configuration screen, use the shared API client, one saved baseline and one draft per saved section, route-backed child tabs with `Outlet`, unsaved-navigation protection and explicit save and error states. Read-only access renders data without writable controls. Options and search endpoints need the calling settings permission too. Only add an independent directory permission if the business directory has that additional boundary; a subject picker relies on the calling management permission.

Verify menu and direct URL behavior, no-grant, page-only and action-only cases, pending and failed checks, session switching, out-of-scope rows, stale transitions, relation target constraints and post-save refresh. Perform actual API requests as ordinary users in addition to UI checks.

A settings screen and its detail routes check the relevant `settings` item, never `page` `access`, so they are not offered as page grants.
