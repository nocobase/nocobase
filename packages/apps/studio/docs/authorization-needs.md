# What a business plugin needs from authorization

The projects plugin now manages its roles in business terms, in its own pages (`/config/roles`, `/config/members`):
each business action is off, reaches "related" records, or reaches all of them, and each settings capability is on or
off. `packages/plugins/app-plugin-projects/server/providers/roles-adapter.ts` translates that into the authorization
plugin's permission sets. This document lists what the translation needed, the call used today, and the smallest core
method that would serve it. It is the input for simplifying the authorization core; nothing here is implemented yet.

Since then Studio owns the roles, and a business action's scope is resolved to `'all' | 'none' | { users }` before a plugin sees it; [permission-scopes.md](permission-scopes.md) describes levels, user sets and how an organization plugin plugs in.

## What the business actually uses

The services never evaluate a database policy. Per request they read one plain object (`shared/access.ts`,
`Permissions`):

```ts
{
  scopes:   { 'pm.issues/close': 'none' | 'related' | 'all', … },  // one per business action
  settings: { 'pm.labels/update': true | false, … },               // one per capability
}
```

and apply "related" with their own rules (`domains/*/*.access.ts`). Everything else the plugin registers exists so
that this object can be stored as permission sets and shown in the generic permission pages.

## Needs, calls today, and the simplest core method

| #   | Need                                                                                            | Today                                                                                                                                                                                    | Simplest core method                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Store a role as ability → level, plus flags, and read it back                                   | Composite grants with a data-scope policy per action (`{ pmIssues: 'pm.managed' }`), settings grants, page grants; parsed back by the adapter (`roleOf`, `grantsOf`)                     | `roles.save(key, { title, abilities: Record<string, string>, flags: Record<string, boolean> })` and `roles.get(key)`, the level an opaque string the plugin declared |
| 2   | Resolve a user's effective abilities once per request                                           | `authorize()` on each composite action, then `scopeOfDecision` reads `effect` and the nested checks' `conditions.scope === true` to tell `all` from `related` (`access/permissions.ts`)  | `abilitiesOf(user): { [ability]: level }`, the highest level across the user's roles, by a declared order (`none < related < all`)                                   |
| 3   | Check it inside a transaction                                                                   | Impossible on SQLite (a check made inside a transaction deadlocks), so everything is resolved up front                                                                                   | The same call, bound to the caller's connection                                                                                                                      |
| 4   | Assign or replace a user's roles within the plugin's namespace, leaving other assignments alone | `replaceSubjectAssignments({ managedPermissionSets, permissionSets })`                                                                                                                   | `roles.replaceFor(user, keys, { namespace })`                                                                                                                        |
| 5   | List holders of each role, and a user's roles                                                   | `listAssignments()` over every set, filtered by the plugin                                                                                                                               | `roles.holders(key)`, `roles.of(user)`                                                                                                                               |
| 6   | Tell who is a system administrator (to hide them)                                               | `listAssignments(rootSet)`, with the root set's key read from the app config (`authorization.permissionSets.rootSet`)                                                                    | `isSuperuser(user)` / `superusers()`                                                                                                                                 |
| 7   | Keep built-in roles and the last owner                                                          | `permissionSets.protect({ keys, allow, requireActiveAssignment, assignableTo })`                                                                                                         | Keep: it is small and business-shaped                                                                                                                                |
| 8   | Refresh open sessions after a change                                                            | `notifyAssignmentsChanged(subject)`; writes through the unbound service announce themselves                                                                                              | Keep; announce on every `save` and `replaceFor`                                                                                                                      |
| 9   | Keep grants added in the permission pages when the plugin rewrites a role                       | The adapter splits the set's grants into its own and "foreign" ones and writes both back; a role with foreign grants cannot be assigned from the plugin (409 `ROLE_HAS_PLATFORM_GRANTS`) | Not needed if a role is only ever edited in one place. This rule exists because two pages edit the same set                                                          |
| 10  | Pages follow abilities                                                                          | The adapter writes `page` grants derived from the abilities (`pagesFor`)                                                                                                                 | A route declares the ability it needs (`authz: { ability: 'pm.issues/view' }`); no page grants                                                                       |
| 11  | A page open to "anyone who may read any of these settings"                                      | Not expressible; `/config` uses `authz: 'skip'` and filters its tabs                                                                                                                     | Route authz takes a predicate or a list (`anyOf`)                                                                                                                    |

## Ceremony that exists only for the generic permission pages

None of this is read by the business at run time. It is there so the back-office permission pages can show and edit the
plugin's grants, and so their inspector can explain them.

- **Composite resources** (`defineCompositeResource` for `pm.projects` and `pm.issues`): one per business, one action
  per ability, each wrapping a database permission on its collection.
- **Record access resolvers** (`pm.visible`, `pm.managed`): filters on the collection's own columns that only
  approximate the real rules, used by nothing but the inspector. The real rules need relations the resolvers cannot
  traverse.
- **Data-scope titles**: a title for every `.grant()`, or the page shows the collection name.
- **Collection registration** (`authz.database.collections.add`) and titles for both collections.
- **Workspace sections** (`authz.ui.sections.add`, `authz.ui.place`): where each resource appears in the pages.
- **Settings items** registered with titled actions (`authz.settings.add`).
- **Page grants** for every page (`pm-my-issues`, `pm-issues`, `pm-projects`), which users had to tick by hand until the
  adapter derived them.
- **A catalog endpoint** for the role editor, a copy of all of the above in a shape the client could render. It is gone: the client builds the editor from `shared/access.ts`.
- **Seeds written in grant shape** (now Studio's `database/main/seeds/202610010022_studio_roles.ts`): the built-in roles
  as permission-set rows, repeating the business table in a second vocabulary.

## What this suggests

- The core a business plugin calls could be four things: declare abilities with their levels, save and read a role in
  those terms, assign roles, and resolve a user's abilities (inside a transaction too).
- Collection-level grants, composites, record access and the inspector can stay for applications that configure
  access in the back office, as a layer over that core rather than the only way in.
- A role should be edited in one place. If the back office can still edit a plugin's roles, it should do so through
  the same ability vocabulary (a registry of role editors), which also removes need 9.
