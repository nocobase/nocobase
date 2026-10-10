# Build an organisation dimension

Use this reference when permission sets should follow where people sit in the organisation: departments, and optionally positions or roles. It builds the organisation in the application and plugs it into authorization as an inherited subject type, so an administrator assigns a permission set to a department and its members inherit it. Read [application permission development](authorization.md) and the installed `nocobase-app-plugin-authorization` Skill, especially its `references/subjects-and-administration.md`, before starting.

## When to use it, and its scope

Build this when access follows a department tree: a user belongs to several departments, one of them primary, and a permission set assigned to a department reaches everyone in it and in the departments below it. Departments and memberships are disabled rather than deleted, because assignments and history keep referring to them. Positions and roles are not built in; model them the same way when the business needs them, as [subjects, sync and seeds](organization/subjects.md#positions-and-roles) describes.

## Model decisions

| Table               | Fields                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `departments`       | `id` string primary key, `title`, `parentId` nullable, `managerId` nullable (the head), `active` default true, `sortOrder` integer default 0, business attributes |
| `departmentMembers` | `id` string primary key, `departmentId`, `userId`, `primary` default false, `active` default true                                                                 |

- Ids are stable strings. Permission-set assignments, sharing rules and seeds store the department id, so never reuse or renumber one. Generate them with `idGeneratorToken` or use a fixed code chosen by the administrator.
- `departmentMembers` is unique on `(departmentId, userId)`, indexed on `userId`. `userId` is the authentication plugin's user id; read users only through `userAdministrationServiceToken` from `@nocobase/app-plugin-authentication`, never through its table. A seed that creates demonstration accounts is the one exception.
- A department tree is small enough to load whole. Resolve ancestors and descendants in memory from one `select id, parentId, active` and stop at a node already visited, so a cycle written by mistake cannot loop forever. Reject a `parentId` that would create a cycle when saving.
- A department counts only while it and every ancestor are active. Disabling a parent therefore disables its subtree without touching child rows.
- At most one active primary membership per user. Clear the others and set the new one inside the same transaction as the membership write.
- Business attributes of a department, such as the `region` its members work in, are ordinary nullable columns on `departments` that a sync carries into business data scopes.
- `title` holds plain text for a department someone creates, and an encoded translation descriptor for a seeded one.
- `managerId` is the department head, a user who need not be a member; heads are a derived subject type, not a table.

## Steps

1. Write the tables in one self-contained migration and put the rules in one organisation service: [model and service](organization/model-and-service.md).
2. Mount the organisation routes and build the settings page under one localized name: [routes and settings page](organization/settings-page.md).
3. Register the department subject type, sync department attributes into business data, refresh sessions after membership changes, and seed the tree, accounts and assignments: [subjects, sync and seeds](organization/subjects.md).
4. Register the department-head subject type and the department data scopes: [department scopes and heads](organization/scopes.md).
5. Decide who gets what across departments, heads and cross-department work: [permission design](organization/permission-design.md).
6. Cover the test matrix against the real application: [testing](organization/testing.md).

Permission-set assignment belongs to the authorization plugin and its API; do not build a second assignment model. The core works with the authorization plugin alone; default access, sharing rules and restriction rules are optional plugins, so never make the organisation depend on them.

## Pitfalls

- Disabling a parent is a check on the ancestor chain, not a cascade that rewrites child rows.
- Never accept membership, departments or subjects from the client. `resolveFor` reads the database, and background work that calls `authz.for(identity)` supplies verified subjects itself.
- `list`, `resolve` and the picker run behind the settings item of the endpoint calling them — permission sets, the inspector or a rule plugin — not behind your organisation item. Add a check of your own in them only if the directory has an independent boundary.
- Inspecting a department through the authorization plugin's inspector API shows the department's own grants, not the union of its members'. Inspect a member to see what inheritance gives that person.
- A department id stored in an assignment outlives the department; disable instead of deleting so its assignments stay readable and revocable.
- Never build a separate role-to-permission table; it would bypass the workspace, the inspector and the rule plugins.
