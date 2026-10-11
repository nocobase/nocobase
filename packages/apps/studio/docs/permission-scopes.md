# Permission scopes and organization structure

Studio's roles say how far each business action reaches. This page explains how that reach is modelled, and how a future organization-structure plugin (departments, positions, "my department", "my department and its subdepartments") plugs in without changing any business plugin.

## Levels, level actions, user sets and relations

Four things work together, each owned by one side:

| Concept        | Owner                                                       | What it is                                                                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Level action   | Each business plugin (`shared/access.ts`, `levelActionsOf`) | The plugin registers its businesses with the authorization plugin as its own resource type (`pm`, `rel`, `agents`, `kb`), each level of an action its own action: `pm:pm.issues` `edit.related` and `edit.all`. An action without related records is registered as itself (`create`). |
| Level          | Studio (`shared/access.ts`, `LEVELS`)                       | `none`, `related`, `all`, lowest first. A role holds the level action of each business action it reaches; holding several, the highest counts. The role editor offers each action's levels as one select, from `GET /api/access/catalog`.                                             |
| Level resolver | Studio (`server/access/scope-levels.ts`)                    | Turns a level into a `Scope` for one caller: `none`, `all`, or `{ users }`. `related` resolves to the caller alone.                                                                                                                                                                   |
| Relation       | Each business plugin (`shared/access.ts`, `RELATIONS`)      | How a record of an action relates to a user, such as "the project's lead or a member" or "the issue's owner or its project's lead". `null` means the action has no records: it is held or not, and has no levels.                                                                     |

A business plugin receives only resolved scopes (`Permissions.scopes`, typed `'all' | 'none' | { users }`), and filters by "the record relates to any user of the set" with its own relation, using `reaches(scope, ...userIds)` or an `in` filter. It never sees a level, so it does not know whether a set came from `related`, from a department, or from anything else.

Studio reads what each role grants over the catalog the plugins registered (`server/access/catalog.ts`): `edit.all` is `pm.issues/edit` at `all`. A grant with a policy is not read, as the authorization plugin does not permit one. `StudioAccess.permissionsOf(identity)` reads the roles, narrows them by a credential's key scope (a business action reaches at most the highest of its levels the scope covers), and resolves each distinct level once per request (`resolveScopes`). Release management, the knowledge base and the agents plugin get their scopes the same way (`StudioAccess.resolve`, `permissionsOfUser`).

## Adding a department level

An organization plugin stays headless and generic: it owns departments, memberships and the hierarchy, and exposes a service such as `usersOfDepartmentOf(userId, { subtree })`. It knows nothing of projects or issues. Then:

1. Studio adds the level to `LEVELS`, between `related` and `all`, with its title in both locales, and passes its resolver to `createStudioAccess` in `server/access/provider.ts`: `levels: { ...BUILT_IN_LEVELS, department: async (userId) => ({ users: await org.usersOfDepartmentOf(userId) }) }`. `LevelResolvers` is a record over every level, so the build fails until each level has a resolver.
2. Each business plugin adds `department` to its `ACTION_LEVELS`, so it registers `edit.department` beside `edit.related` and `edit.all`. Its filtering does not change: a project whose lead is in the caller's department is within `pm.projects/manage` by the relation the plugin already declares.
3. Roles grant the level like any other, through the role editor or a seed.

Release management relates Apps to a set through `ReleasesAccess.relatedAppIds` and `isRelated`, which take the set; Studio's pull-request-preview source (the issues a preview's pull request is linked to) is still asked per user of the set. The client mirrors the server: an action reaching a user set shows its controls where the record relates to one of the users, and the server decides the rest.

## Org units as authorization subjects

Who holds a role is a separate question from how far it reaches. The authorization library already models memberships as identity subjects (`AuthorizationIdentity.subjects`, `authz.subjects.add(type, { resolveFor, filterActive })` in `packages/libs/authorization`): a permission set assigned to `{ type: 'department', id }` is held by everyone whose identity carries that subject. An organization plugin would register its subject types (`department`, `position`) with `resolveFor(principal)` returning the units a user belongs to, and `filterActive` dropping removed ones. Studio's `StudioAccess` already builds identities through `authz.subjects.resolveFor`, so roles assigned to a department reach its members without further changes.

Two places in Studio would need a decision when that lands, and are left as they are today: the built-in roles are protected with `assignableTo: ['user']`, so only custom roles could be given to an org unit until that list grows; and the members page (`roles.members`, `heldBy`) lists only direct user assignments. Neither the authorization library nor any business plugin needs to change for org units to become subjects.
