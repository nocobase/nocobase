# Request checks and permission-set services

Resolve the existing `authorizationToken` in the application. This reference covers request evaluation and runtime assignment; use [runtime setup](runtime-api.md) for installation and [code versus seeds](code-and-seeds.md) for initial configuration. Do not construct a separate authorization instance for a business feature.

## Evaluate a request

`authz.middleware()` sets the request's `authz` variable to an `AuthorizationContext` for the signed-in identity. The principal is the authenticated actor; subjects add verified memberships such as teams, and the principal itself also matches grants. Subject ids are literals, including the `*` in `authenticated:*`. A context built by hand with `authz.for(identity)` uses exactly the identity it is given: resolve and include memberships yourself.

| `AuthorizationContext` member              | Result and use                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authorize({ resource, action, params? })` | The full decision: `permit`, `deny`, or `conditional` with `conditions`, and `reasons`                                                                                          |
| `can(request)`                             | `true` only for `permit`; a business check reports feature availability, not record access                                                                                      |
| `require(request)`                         | Throws `AuthorizationDeniedError`, which answers `403 { code: 'FORBIDDEN', message }` without an `onError`, unless the decision is `permit`; use for unconditional capabilities |
| `snapshot()`                               | `{ unrestricted, permissions }` for the client; not an executable data policy                                                                                                   |

Create one context per request and reuse it within that request only, never across identities. Its grant and rule reads are shared by the underlying checks of a business action. Execute a conditional decision only through the adapter that understands its conditions. Unknown types, unregistered catalog items or actions, conditional decisions without conditions and handler failures deny.

## Permission sets

`definePermissionSet(key).title(title).grant(...grants).build()` from `@nocobase/authorization/permission-sets` returns `{ key, title?, grants }`. Each grant is `{ resource: { type, id }, actions: [{ action, policy? }] }`; build them with `authz.pages.grant(id)`, `authz.settings.grant(id, actions)` and a composite reference's `grant(...)` rather than by hand. A composite grant stores `policy: { type: 'composite', scopes }`, one value per data scope: a record access key such as `'recordsIOwn'`, or a record selection. An empty value `''` selects nothing. Titles accept strings or `{ key, ns }`.

| `authz.permissionSets`                                                                     | Contract                                                                |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `create(input)`, `update(key, input)`                                                      | A complete `{ key, title?, grants }` definition, not a partial patch    |
| `get(key)`, `list()`, `delete(key)`                                                        | Read and remove definitions                                             |
| `assign({ id?, permissionSet, subject })`, `revoke(id)`                                    | Create or remove an assignment                                          |
| `listAssignments(permissionSet?)`                                                          | Every assignment, or those of one set                                   |
| `replaceSubjectAssignments({ subject, managedPermissionSets, permissionSets })`            | Replace only the managed subset; preserve unrelated assignments         |
| `getEffective({ principal, subjects? })`                                                   | The sets an identity holds                                              |
| `protect({ owner, keys, allow?, requireActiveAssignment?, assignableTo?, unrestricted? })` | Declare code ownership and invariants; returns a release function       |
| `protection(key)`, `assertWritable(key, operation)`                                        | Read and enforce protection; `protection(key)?.unrestricted` marks root |
| `assertSubjectRemovable(subject)`                                                          | Ensure disabling or removing a subject leaves protected sets usable     |
| `withTransaction(transaction)`                                                             | Bind every store operation to a caller-owned transaction                |
| `notifyAssignmentsChanged(subject)`                                                        | Announce a change; subscribe through `authz.onGrantsChanged(listener)`  |

The platform protects the root and default sets. Root grants unrestricted access, accepts user assignments and requires a remaining active assignment; the default set's grants may be edited. Business features create their own editable sets and leave platform protection and audience assignments to their owner. Whether the current identity is unrestricted is `snapshot().unrestricted`.

Generic HTTP management rejects changes to a protected key. Owner-side service calls are trusted and bypass `assertWritable`. `requireActiveAssignment` and `assignableTo` are enforced by the assignment APIs. Relevant failures include `PermissionSetProtectedError`, `PermissionSetLastAssignmentError` and `PermissionSetSubjectNotAllowedError`.

Protected assignment changes run in a database transaction that locks the protected set before checking remaining active assignments. Custom subject `filterActive` callbacks must use the supplied transaction. When a business mutation owns the transaction, bind the service to that connection and notify through it; the bound service publishes after the commit and not at all on rollback:

```ts
const subject = { type: 'user', id: userId };
await database.transaction(async (connection) => {
  const sets = authz.permissionSets.withTransaction(connection);
  await sets.assertSubjectRemovable(subject);
  await disableUser(connection, userId); // Application-owned mutation.
  await sets.notifyAssignmentsChanged(subject);
});
```

Never separate the removal check from the user mutation's transaction. Use the application's existing store; replacing persistence is outside ordinary feature development.

## Optional record rules

Default access, sharing and restriction rules require separate App plugins. Follow [capability discovery](optional-capabilities.md) and the owning installed Skill for implementation, APIs and seeds. Library exports alone do not establish an installed App capability.
