# Organisation routes and settings page

Part of [the organisation dimension](../organization.md). The handlers call [the organisation service](model-and-service.md#the-organisation-service).

## Routes

Mount the organisation endpoints as an isolated router under your prefix with `auth.required()` and `authz.middleware()`, and check the departments settings item in every handler: `read` for lists and details, `update` for writes. Read [server routes](../server-routes.md) for the router, its registration and why each route owns its security.

```ts
routes.use('*', auth.required(), authz.middleware());
const require = (c: Context<AuthorizationEnv>, action: 'read' | 'update') =>
  c
    .get('authz')
    .require({ resource: { type: 'settings', id: 'departments' }, action });

routes.get('/departments', async (c) => {
  await require(c, 'read');
  return c.json({ data: await organization.listTree() });
});
routes.post('/departments/:id/members', async (c) => {
  await require(c, 'update');
  const changed = await organization.addMember({
    departmentId: c.req.param('id'),
    ...(await readMemberInput(c)),
  });
  await refreshUsers(changed); // after the commit
  return c.json({ data: { changed } }, 201);
});
```

`refreshUsers` is shown in [refresh sessions](subjects.md#refresh-sessions-after-membership-changes). A denied `require` answers `403 PERMISSION_DENIED`, reason `AUTHORIZATION_DENIED`, on its own; turn the service's own validation errors into an `ApiError` (`INVALID_ARGUMENT`, `NOT_FOUND` or `ALREADY_EXISTS`) with a `reason` the page translates, and let anything else propagate. See [HTTP API design](../http-api.md). Validate every input, including that `userId` names an enabled user and that a new `parentId` creates no cycle. Answer an unknown department with 404.

## One localized name

Pick one term, such as 部门 / Departments, and use it for the settings menu entry, the settings item and its workspace subsection, and the subject type's `administration.title`, each as a `{ key, ns }` descriptor with a translation in every locale. An administrator who assigns a set to "部门" in the workspace then finds the same word in the menu. `ns` is the application's package name, which is its translation namespace. Register the settings item in the provider's `boot`, as the authorization Skill's `references/runtime-api.md` "Settings items" shows:

```ts
const label = (key: string) => ({ key, ns: 'my-app' });
authz.ui.sections.add({
  name: 'departments',
  title: label('departments'),
  parent: 'administration',
});
authz.settings.add({
  id: 'departments',
  title: label('departments'),
  actions: [
    { name: 'read', title: label('authz.read') },
    { name: 'update', title: label('authz.update') },
  ],
});
authz.ui.place(
  { type: 'settings', id: 'departments' },
  { section: 'departments' },
);
```

## Seeded titles are translation descriptors

A department an administrator creates stores its title as plain text. A seeded department stores `encodeAuthorizationTitle({ key, ns })` from `@nocobase/authorization/core`, the way seeded permission-set titles are stored, and its translations ship in the client locales under the same `ns`. Return the stored value unchanged from every endpoint and render it with `titleText`, so the tree, the picker and the workspace all show it in the viewer's language.

## Settings page

Declare one settings page in `client/routes.ts` with `defineSettingsRoutes`, titled with the same key; the department details are a child route, so they inherit the entry page's `authz`:

```ts
defineSettingsRoutes([
  {
    name: 'departments',
    path: '/departments',
    navigation: { title: 'navigation.departments', icon: Network },
    authz: {
      resource: { type: 'settings', id: 'departments' },
      action: 'read',
    },
    componentLoader: () => import('./pages/settings/departments/index.js'),
    children: [
      {
        name: 'department',
        path: ':departmentId',
        componentLoader: () =>
          import('./pages/settings/departments/department.js'),
      },
    ],
  },
]);
```

Lay the page out like the permission workspace: a searchable tree on the left with create-child, rename and enable or disable, and the selected department on the right with a members tab (a table with a primary badge, add through a user picker, remove, set primary) and a basic-info tab. Show loading, empty and error states, translate every label and every error code, and hide each write unless `useCan({ resource: { type: 'settings', id: 'departments' }, action: 'update' })`. Render every title with `titleText` from `@nocobase/app-plugin-authorization/client/management`, which translates a descriptor and passes plain text through; reuse its `PermissionsPage`, `ManagementTable`, `ConfirmDialog` and `SelectField` so the page matches the workspace. Follow [pages and routes](../frontend/references/page.md), [child routes](../frontend/references/child-routes.md), [dialogs and drawers](../frontend/references/overlay.md), [list pages](../frontend/references/table.md) and [theme](../frontend/references/theme.md). Permission-set assignment stays in Settings → Authorization; do not build a second assignment editor.
