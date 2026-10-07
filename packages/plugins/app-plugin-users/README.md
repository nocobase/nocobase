# @nocobase/app-plugin-users

Reusable user administration for NocoBase applications. The plugin provides a
Settings or App page, authenticated and authorized HTTP APIs, and a role-scope
extension point. Authentication remains the source of user and session data;
applications and business plugins remain responsible for roles and grants.

## Register the plugin

Register Authentication and Authorization before Users on both runtimes:

```ts
// client/plugins.ts
users({ mount: 'settings', path: '/users' });

// server/plugins.ts
users;
```

The default route is `/settings/users`. Set `mount: 'app'` to mount the same
owned route under the App and add its protected primary-navigation entry. The
route and navigation use the same check, `access` on page `users`. Provide
`componentLoader` to replace only the page implementation without changing its
identity, path, or navigation.

The application must grant `access` on page `users` and the required `user`
actions on `{ type: 'user', id: '*' }`.
Users does not create roles or grant access by itself.

## Server contracts

- `userManagementServiceToken` provides list, create, update, enable, disable,
  password reset, Session revocation, and role-scope replacement operations.
- `userRoleScopeRegistryToken` lets an application plugin expose its own role
  choices and assignment implementation through `UserRoleScope`.
- Role options may be marked non-assignable or non-removable when a scope needs
  to display protected assignments without letting the Users page change them.
  A scope can also declare that authenticated-subject defaults apply separately
  so the page does not present inherited access as a direct user role.
  Application-owned labels can provide an i18n key and namespace while keeping
  the plain label as a fallback.
- Scopes backed by a shared assignment store should implement optional
  `getMany()` so one user-list page does not issue one role query per user.
- All `/api/users/*` routes require an authenticated session and a matching
  `user:<id>:<action>` grant. Creating a user requires both `create` and
  `assign-role`.

Authentication owns the `user`, `account`, and `session` tables. This plugin
uses Authentication's public administration service and never duplicates or
directly owns those records. Creating a user and assigning application roles
uses one database transaction. Password reset and database Session revocation
also share a transaction, so a revocation failure does not leave the new
password committed. Duplicate administrator-created emails or usernames return
a stable `409 ALREADY_EXISTS` instead of exposing a database error.

## HTTP API

| Method   | Path                                          | Success                                                |
| -------- | --------------------------------------------- | ------------------------------------------------------ |
| `GET`    | `/api/users/options`                          | `200 { data }`                                         |
| `GET`    | `/api/users`                                  | `200 { data: [...], meta: { page, pageSize, total } }` |
| `POST`   | `/api/users`                                  | `201 { data }`                                         |
| `PATCH`  | `/api/users/:userId`                          | `200 { data }`                                         |
| `DELETE` | `/api/users/:userId?confirm=true`             | `204`                                                  |
| `POST`   | `/api/users/:userId/disable`                  | `200 { data }`                                         |
| `POST`   | `/api/users/:userId/enable`                   | `200 { data }`                                         |
| `PUT`    | `/api/users/:userId/roleScopes/:scope`        | `200 { data }`                                         |
| `POST`   | `/api/users/:userId/resetPassword`            | `204`                                                  |
| `POST`   | `/api/users/:userId/revokeSessions`           | `204`                                                  |
| `GET`    | `/api/users/invitations`                      | `200 { data: [...], meta: { total } }`                 |
| `POST`   | `/api/users/invitations`                      | `201 { data: [...] }`, one result per address          |
| `POST`   | `/api/users/invitations/:invitationId/resend` | `200 { data }`                                         |
| `DELETE` | `/api/users/invitations/:invitationId`        | `204`, revokes a pending invitation                    |
| `POST`   | `/api/users/invitations/lookup`               | `200 { data }`, public, `{ token }`                    |
| `POST`   | `/api/users/invitations/accept`               | `200 { data }`, public, `{ token, name, password }`    |

The invitation list holds pending and expired invitations only, so it is not paged. `lookup` and `accept` need no session: the token in the body is the credential.

Each route is described, with its parameters, request and response schemas and error statuses, in the application's API document at `/api/swagger/docs` (JSON at `/api/swagger`, served to a signed-in user or a valid API key), under the `Users` tag with operation ids such as `usersDisableUser`.

The list accepts `page`, `pageSize` (default 20, capped at 100), `q` (name, username or email), `status`, and `roleScope` with `role`. Every input is validated: an unknown body field or an invalid value answers `400 INVALID_ARGUMENT` with reason `INVALID_INPUT`. Failures use the standard error body; branch on `error.reason`:

| Reason                                                                                                                                                                                      | Status                                    | Domain           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------- |
| `USER_NOT_FOUND`                                                                                                                                                                            | `404 NOT_FOUND`                           | `users`          |
| `ROLE_SCOPE_NOT_FOUND`                                                                                                                                                                      | `404` in the path, else `400`             | `users`          |
| `ROLE_SCOPE_REQUIRED`, `INVALID_ROLE_SCOPE_VALUE`                                                                                                                                           | `400 INVALID_ARGUMENT`                    | `users`          |
| `SELF_DELETE_NOT_ALLOWED`, `USER_DELETION_NOT_CONFIGURED`, `PROTECTED_ROLE_ASSIGNMENT` and the reasons of an application role scope, such as Hub's `HUB_ADMIN_REQUIRED` and `USER_HAS_APPS` | `400 FAILED_PRECONDITION`                 | `users`          |
| `INVITATION_NOT_FOUND`: no invitation by that id, or, from `lookup` and `accept`, by that token (`400` with a field violation on `token`)                                                   | `404 NOT_FOUND` or `400 INVALID_ARGUMENT` | `users`          |
| `INVITATION_EXPIRED`, `INVITATION_ACCEPTED`, `INVITATION_REVOKED`, `INVITATION_CLOSED`                                                                                                      | `400 FAILED_PRECONDITION`                 | `users`          |
| `INVALID_PREFERENCE_KEY`, `INVALID_PREFERENCE_VALUE`, `TOO_MANY_PREFERENCES`                                                                                                                | `400 INVALID_ARGUMENT`                    | `users`          |
| `LAST_ASSIGNMENT`                                                                                                                                                                           | `400 FAILED_PRECONDITION`                 | `authorization`  |
| `USER_EMAIL_CONFLICT`, `USER_USERNAME_CONFLICT`, `USER_IDENTITY_CONFLICT`                                                                                                                   | `409 ALREADY_EXISTS`                      | `authentication` |
| `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`                                                                                                                                                   | `400 INVALID_ARGUMENT`                    | `authentication` |

A role scope reports a refusal by throwing `UserRoleScopeError(reason, message, status)`: `404` answers `NOT_FOUND`, `409` answers `FAILED_PRECONDITION`, and `400` answers `INVALID_ARGUMENT`.

## Client contract

`UsersClient` is available from
`@nocobase/app-plugin-users/client/user-client` for App-owned UI that needs the
same API contract. The built-in page supports pagination, search, status and
role filters, account editing, enable/disable, password reset, Session
revocation, and application-provided role scopes. Empty scopes are shown as
unassigned rather than silently disappearing from the user row.

## Personal preferences

Each signed-in person keeps small preferences of their own on the server, such as their language, their theme or whether a sound plays, so a choice follows them to every browser. The plugin stores them and never interprets one: the application names the keys.

- The `userPreferences` table (migration `202610020201_create_user_preferences`) holds one row per person and key, the value as JSON text of at most 4 KB, and at most 200 keys per person. A key is lower-case letters, digits, dots, dashes and underscores, starting with a letter (`theme.mode`, `inbox.chime`).
- `userPreferencesServiceToken` resolves `UserPreferencesService`: `list`, `get`, `set`, `setMany`, `remove` and `removeAll`, for whichever user the caller names.
- `/api/users/me/preferences` serves only the signed-in person's own: `GET /` answers `{ data: { <key>: <value> } }`, `PATCH /` sets several keys from an object, `PUT /:key` sets one from `{ value }`, `DELETE /:key` answers 204. It needs no grant, and `auth.required()` refuses a scoped API key and a service account's key.

In the browser, `@nocobase/app-plugin-users/client/preferences` exports `useUserPreference(key, { defaultValue, parse?, legacy? })`, which returns `[value, setValue, { loaded, stored }]`. The server is the source of truth; a cache in `localStorage` lets the first frame paint with the last known values, and the server's replace them when they arrive. `legacy` reads a value the application kept in the browser before preferences existed: when the server holds nothing for the key, that value is written to it once. `UserPreferencesClient` and `useUserPreferenceStore` are the same API without the hook.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-users lint
pnpm --filter @nocobase/app-plugin-users typecheck
pnpm --filter @nocobase/app-plugin-users test
pnpm --filter @nocobase/app-plugin-users build
```

## Authorization subject selector

When authorization is installed, the plugin registers the `user` subject type with its active-account filter and an administration selector. Searches reuse the user administration service with server-side pagination and return enabled accounts. Name resolution queries the requested IDs, including disabled accounts already referenced by a saved rule. Both callbacks require `read` on `{ type: 'user', id: '*' }` before querying; the authorization plugin separately checks settings-page access and assignment writes.

## Permission-set integration

When the authorization plugin is installed, Users automatically registers the `app` permission-set scope. No application Provider is needed. Set `users.permissionSets: false` in application configuration when providing a replacement scope, as Hub does. Direct assignments remain separate from permissions inherited through authenticated users or other subjects. Protected unrestricted assignments cannot be changed through this scope.

The Settings page uses a searchable selection list for both user creation and the assignment drawer. Changes are saved together; labels use permission-set presentation metadata and update with the client locale while custom titles remain unchanged.

## User deletion

`DELETE /api/users/:userId?confirm=true` requires the `user/delete` action and the `confirm=true` query parameter, and answers `204`. The service also rejects deleting the acting user. Application role scopes can implement `assertCanDelete(userId, actorId, connection)` and `onDelete(userId, connection)` to protect owned resources and remove credentials in the same transaction. Hub grants deletion only to its Platform Administrator and registers those lifecycle rules; Users does not grant access by default. Failed cleanup rolls back the deletion. Repeating a deletion changes nothing and answers `404 USER_NOT_FOUND`.

Deletion removes the user from management lists, revokes sessions and removes sign-in accounts. Authentication retains a disabled identity with `deletedAt` and `deletedBy` for historical attribution; it cannot be re-enabled through user management. Email and username remain reserved. The authenticated deletion route emits a structured `user.delete` security event without credentials. The UI requires confirmation and reports failures through the application's notification host.
