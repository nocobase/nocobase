import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const {
    evaluateAccess,
    getEffectiveRoles,
    getPermissionsForDataSource,
    resolveActionPermission,
  } = await server.ssrLoadModule("/src/lib/nocobase/acl/evaluator.ts");
  const { resolveAclDataSourceKey } = await server.ssrLoadModule(
    "/src/lib/nocobase/acl/data-source.ts"
  );
  const { filterMenuItemsByAcl, findFirstAccessibleRoute } =
    await server.ssrLoadModule("/src/lib/nocobase/acl/menu.ts");
  const {
    clearRecordPermissions,
    getRecordActionPermission,
    updateRecordPermissions,
  } = await server.ssrLoadModule("/src/lib/nocobase/acl/record-permissions.ts");
  const { RoleSwitcher } = await server.ssrLoadModule(
    "/src/extensions/nocobase-acl/components/role-switcher.tsx"
  );
  const { getRoleOptions, resolveRoleTitle } = await server.ssrLoadModule(
    "/src/extensions/nocobase-acl/components/role-options.ts"
  );

  const permissions = {
    currentRole: "editor",
    roles: ["editor", "auditor"],
    roleMode: "allow-use-union",
    resources: ["blog_posts"],
    actionAlias: {
      list: "view",
      get: "view",
    },
    actions: {
      "blog_posts:view": { fields: ["id", "title"] },
      "blog_posts:update": { fields: ["title"] },
    },
    strategy: {
      actions: ["view:all"],
    },
    snippets: ["pm.*"],
  };

  assert.deepEqual(
    resolveActionPermission({
      permissions,
      resource: "blog_posts",
      action: "list",
    }),
    { fields: ["id", "title"] }
  );
  assert.deepEqual(getEffectiveRoles(permissions), ["editor", "auditor"]);
  assert.equal(
    evaluateAccess(permissions, {
      roles: {
        anyOf: ["editor"],
        allOf: ["editor", "auditor"],
        noneOf: ["anonymous"],
      },
    }),
    true
  );
  assert.equal(
    evaluateAccess(permissions, {
      roles: { noneOf: ["editor"] },
    }),
    false
  );
  assert.equal(
    evaluateAccess(permissions, {
      roles: { anyOf: ["editor"] },
      resource: "blog_posts",
      action: "create",
    }),
    false
  );
  assert.equal(
    evaluateAccess(
      { ...permissions, allowAll: true },
      { roles: { anyOf: ["missing-role"] } }
    ),
    true
  );

  const externalPermissions = {
    ...permissions,
    allowAll: true,
    actionAlias: { list: "view" },
    dataSources: {
      analytics: {
        allowAll: false,
        resources: ["orders"],
        actionAlias: { list: "read" },
        actions: { "orders:read": {} },
      },
    },
  };
  assert.deepEqual(
    getPermissionsForDataSource(externalPermissions, "analytics"),
    {
      ...externalPermissions,
      allowAll: false,
      resources: ["orders"],
      actionAlias: { list: "read" },
      actions: { "orders:read": {} },
      snippets: externalPermissions.snippets,
    }
  );
  assert.equal(
    evaluateAccess(externalPermissions, {
      resource: "orders",
      action: "list",
      dataSourceKey: "analytics",
    }),
    true
  );
  assert.equal(
    resolveAclDataSourceKey({
      acl: {
        type: "collection",
        dataSourceKey: "analytics",
      },
    }),
    "analytics"
  );

  assert.equal(
    evaluateAccess(permissions, {
      resource: "settings",
      action: "list",
      resourceItem: {
        name: "settings",
        meta: { acl: { type: "snippet", name: "pm.acl" } },
      },
    }),
    true
  );
  assert.equal(
    evaluateAccess(
      {
        ...permissions,
        snippets: ["pm", "pm.*", "!pm.data-source-manager*"],
      },
      {
        resource: "settings",
        action: "list",
        resourceItem: {
          name: "settings",
          meta: {
            acl: { type: "snippet", name: "pm.data-source-manager" },
          },
        },
      }
    ),
    false
  );
  assert.equal(
    evaluateAccess(permissions, {
      resource: "blog_posts",
      action: "edit",
      field: "title",
    }),
    true
  );
  assert.equal(
    evaluateAccess(permissions, {
      resource: "blog_posts",
      action: "edit",
      field: "status",
    }),
    false
  );

  clearRecordPermissions();
  updateRecordPermissions({
    resource: "blog_posts",
    recordIds: [1, 2],
    allowedActions: {
      view: [1, 2],
      update: [1],
      destroy: [],
    },
  });
  assert.equal(
    getRecordActionPermission({
      resource: "blog_posts",
      action: "update",
      id: 2,
    }),
    false
  );
  assert.equal(
    evaluateAccess(permissions, {
      resource: "blog_posts",
      action: "edit",
      id: 1,
    }),
    true
  );
  assert.equal(
    evaluateAccess(permissions, {
      resource: "blog_posts",
      action: "edit",
      id: 2,
    }),
    false
  );

  const filteredMenu = filterMenuItemsByAcl(
    [
      {
        key: "restricted-parent",
        name: "restricted-parent",
        route: "/restricted-parent",
        children: [
          {
            key: "public-child",
            name: "public-child",
            route: "/public-child",
            meta: { acl: { type: "authenticated" } },
            children: [],
          },
        ],
      },
    ],
    { ...permissions, strategy: { actions: [] } }
  );
  assert.equal(filteredMenu[0].route, undefined);
  assert.equal(findFirstAccessibleRoute(filteredMenu), "/public-child");

  const roleFilteredMenu = filterMenuItemsByAcl(
    [
      {
        key: "admin-only",
        name: "admin-only",
        route: "/admin-only",
        meta: {
          acl: {
            type: "authenticated",
            roles: { anyOf: ["admin"] },
          },
        },
        children: [],
      },
    ],
    permissions
  );
  assert.deepEqual(roleFilteredMenu, []);

  assert.deepEqual(
    getRoleOptions({
      roles: [
        { name: "admin", title: "Administrator" },
        { name: "member", title: "Member" },
      ],
      roleMode: "allow-use-union",
      allowAnonymous: true,
    }),
    [
      { name: "__union__", title: "Full permissions" },
      { name: "admin", title: "Administrator" },
      { name: "member", title: "Member" },
      { name: "anonymous", title: "Anonymous" },
    ]
  );
  assert.equal(
    resolveRoleTitle({ name: "admin", title: '{{t("Admin")}}' }),
    "Admin"
  );
  assert.equal(typeof RoleSwitcher, "function");
  console.log("NocoBase ACL regression tests passed");
} finally {
  await server.close();
}
