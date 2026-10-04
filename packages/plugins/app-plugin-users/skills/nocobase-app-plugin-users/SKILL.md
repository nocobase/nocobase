---
name: nocobase-app-plugin-users
description: Integrate the Users plugin into a NocoBase App, configure its page placement and permissions, or add an application-owned role scope through the public Server contracts.
metadata:
  short-description: Integrate reusable user administration
---

# User Management App Plugin

Use this Skill when an application needs a user management page or API, or when
another plugin needs to expose application-specific roles in the Users page. Do
not use it to modify the Users plugin source or to replace Authentication's
user, account, or Session storage.

## Public surfaces

- Client registration factory and `UsersClientOptions`:
  `@nocobase/app-plugin-users/client`.
- Typed API client: `UsersClient` and its types from
  `@nocobase/app-plugin-users/client/user-client`.
- Server contracts: `userManagementServiceToken`,
  `userRoleScopeRegistryToken`, `UserRoleScope`, and related types from
  `@nocobase/app-plugin-users/server/tokens`.
- HTTP API: `GET /api/users` (`page`, `pageSize`, `q`, `status`, `roleScope`, `role`; answers `{ data, meta: { page, pageSize, total } }`), `GET /api/users/options`, `POST /api/users`, `PATCH /api/users/:userId`, `DELETE /api/users/:userId?confirm=true`, `POST /api/users/:userId/disable|enable|resetPassword|revokeSessions`, and `PUT /api/users/:userId/roleScopes/:scope`. Failures use the standard error body; branch on `error.reason`, such as `USER_NOT_FOUND`, `SELF_DELETE_NOT_ALLOWED`, `LAST_ASSIGNMENT` or `USER_EMAIL_CONFLICT`.

Every HTTP route requires Authentication and Authorization. Routes check the `user` record type with one of `read`, `create`, `update`, `disable`, `enable`, `assign-role`, `reset-password`, `revoke-sessions` or `delete`. Account creation checks both `create` and `assign-role`. `delete` is permitted only while an application role scope can clean a deleted user up.

## Register and place the page

1. Register Authentication, Authorization, and then Users in the App's Client
   and Server plugin arrays.
2. Configure the Client factory. `users({ mount: 'settings', path: '/users' })`
   produces `/settings/users`; `mount: 'app'` makes the path App-relative and
   registers a primary-navigation entry protected by the same page access rule.
3. Grant the page, `{ resource: { type: 'page', id: 'users' }, actions: [{ action: 'access' }] }` or `authz.pages.grant('users')`, to roles that may open it.
4. Grant only the `user` actions those roles need, on `{ type: 'user', id: '*' }` because `user` is a record type. The plugin creates no roles and grants no access by itself.
5. Use `componentLoader` only to replace the page implementation. It does not
   change the route identity, mount, or path.

The page reports results through `useToaster()` from `@nocobase/app-client`, so the App needs the `@nocobase/app-client` that exports it and registers a toaster service, as the templates do: `client/lib/toaster.ts` from the template, and `this.app.container.instance(toasterToken, createToaster())` in the `register()` of `client/service-provider.ts`, with the `Toaster` component mounted in `client/react-providers.ts`. Without the registration nothing throws, but its toasts are only logged to the browser console. Update `@nocobase/app-client` together with this plugin; the `nocobase-app-upgrade` Skill's `references/edge-cases.md` ("Notifications and the application toaster") has the full steps.

The default `app` permission-set scope is supplied by Users whenever the Authorization plugin's `authorizationToken` is available. Do not copy a user-roles Provider into an application. Set `users.permissionSets: false` to replace the default with an application-owned scope; Hub uses this setting.

## Add an application role scope

Resolve `userRoleScopeRegistryToken` in an application or business plugin
ServiceProvider and register one `UserRoleScope` during `boot()`. The scope owns
its available options, current assignment lookup, role filtering, atomic
replacement, and any disable guard. Unregister it during `shutdown()`.

Use the `DatabaseConnection` passed to each scope method. This is the
caller-owned transaction used to keep account creation or state changes atomic
with role assignments. Do not open an unrelated transaction and do not write
Authentication's internal tables.

For a required single-role scope, set `selection: 'single'` and
`requiredOnCreate: true`. Reject invalid values in the scope and enforce
business invariants such as the last-administrator rule on the server.

Set `assignable: false` or `removable: false` on an option when the Users page
must show a protected assignment but must not add or revoke it. Enforce the
same rule in `replace()` because these flags only control the Client. Set
`hasAuthenticatedDefaultAccess: true` when the scope lists direct assignments
but all signed-in users also inherit separately configured default access; the
page then explains that distinction instead of treating the default as a role.
Use `labelI18nKey` with `labelI18nNs` on a scope or option when its owner has
registered Client locale resources; keep `label` as the readable fallback.
Implement optional `getMany()` when assignments can be read as a batch. Users
uses it for list pages and falls back to `get()` for existing scopes.

## Ownership

- Authentication owns user identity, credentials, account state, password
  hashing, and Sessions.
- Authorization owns Permission Sets, grants, and assignments.
- Users owns the management API, built-in page, orchestration transaction,
  `user` authorization handler, and role-scope registry.
- The App or business plugin owns role definitions, role grants, assignments,
  page placement, and role-specific invariants.
- The plugin's `skills/` source is authoritative. `.agents/skills/` is a
  synchronized copy and must not be edited.

## Permissions and constraints

- Browser route access is only navigation control. The Server independently
  authenticates and authorizes every request.
- An App-mounted page hides its primary-navigation entry until `access` on page `users` is allowed. Direct navigation is checked separately by the Client Route.
- A conditional grant is not accepted as an unrestricted user-management
  grant; use explicit static grants for this resource.
- The plugin does not provide user deletion or invitations.
- Disabled users are rejected by Authentication and lose their existing HTTP
  Sessions and Realtime connections.
- Password hashes, Session tokens, reset tokens, and submitted passwords are
  never returned by the service or included in security events.

## Verification

- A role without `access` on page `users` cannot navigate to the page.
- Anonymous API requests return `401`; authenticated requests without the
  requested `user` action return `403`.
- Creating a user with a required role scope creates both records, while role
  assignment failure rolls back the user.
- Duplicate emails or usernames return a stable `409` conflict. Password reset
  and database Session revocation commit or roll back together.
- Disabling a user invalidates HTTP Sessions and Realtime connections; enabling
  the user requires a new login.
- Role changes become visible after transaction commit and do not alter
  assignments outside the registered scope.
- The target App passes its relevant tests, typecheck, and build. Skill
  synchronization alone proves only that the copy matches this source.

Deletion uses `DELETE /api/users/:userId?confirm=true` and `user/delete` authorization. Obtain an explicit user deletion request before calling it. Application role scopes can guard deletion and clean dependent credentials transactionally. Hub blocks self-deletion, deleting its last active administrator, and deleting owners of Apps. Historical user identities are retained but cannot sign in or appear in management lists.
