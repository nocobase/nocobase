import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const {
    canAccessWithSnapshot,
    getAclDataForDataSource,
    resolveActionPermission,
  } = await server.ssrLoadModule("/src/lib/nocobase/acl/action.ts");
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
    "/registry/nocobase-acl/components/role-switcher.tsx"
  );
  const { getRoleOptions, resolveRoleTitle } = await server.ssrLoadModule(
    "/registry/nocobase-acl/components/role-options.ts"
  );

  const snapshot = {
    status: "ready",
    version: 1,
    data: {
      role: "editor",
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
    },
    meta: {},
  };

  assert.deepEqual(
    resolveActionPermission({
      snapshot,
      resource: "blog_posts",
      action: "list",
    }),
    { fields: ["id", "title"] }
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "blog_posts",
      action: "create",
    }),
    false
  );

  const externalSnapshot = {
    ...snapshot,
    data: {
      ...snapshot.data,
      allowAll: true,
      actionAlias: { list: "view" },
    },
    meta: {
      dataSources: {
        analytics: {
          allowAll: false,
          resources: ["orders"],
          actionAlias: { list: "read" },
          actions: { "orders:read": {} },
        },
      },
    },
  };
  assert.deepEqual(getAclDataForDataSource(externalSnapshot, "analytics"), {
    ...externalSnapshot.data,
    allowAll: false,
    resources: ["orders"],
    actionAlias: { list: "read" },
    actions: { "orders:read": {} },
    snippets: externalSnapshot.data.snippets,
  });
  assert.equal(
    canAccessWithSnapshot(externalSnapshot, {
      resource: "orders",
      action: "list",
      params: { meta: { dataSourceKey: "analytics" } },
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
    resolveAclDataSourceKey(
      { dataSourceKey: "reporting" },
      {
        acl: {
          type: "collection",
          dataSourceKey: "analytics",
        },
      }
    ),
    "reporting"
  );
  assert.equal(
    getRecordActionPermission({
      resource: "blog_posts",
      action: "update",
      id: 3,
    }),
    undefined
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "categories",
      action: "list",
    }),
    true
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "settings",
      action: "list",
      params: {
        resource: {
          name: "settings",
          meta: { acl: { type: "snippet", name: "*" } },
        },
      },
    }),
    true
  );
  assert.equal(
    canAccessWithSnapshot(
      {
        ...snapshot,
        data: {
          ...snapshot.data,
          snippets: ["pm", "pm.*", "!pm.data-source-manager*"],
        },
      },
      {
        resource: "settings",
        action: "list",
        params: {
          resource: {
            name: "settings",
            meta: {
              acl: { type: "snippet", name: "pm.data-source-manager" },
            },
          },
        },
      }
    ),
    false
  );
  assert.equal(
    updateRecordPermissions({
      resource: "blog_posts",
      recordIds: [4],
      allowedActions: { update: [] },
    }),
    true
  );
  assert.equal(
    getRecordActionPermission({
      resource: "blog_posts",
      action: "update",
      id: 4,
    }),
    false
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "settings",
      action: "list",
      params: {
        resource: {
          name: "settings",
          meta: { acl: { type: "snippet", name: "pm.acl" } },
        },
      },
    }),
    true
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "blog_posts",
      action: "edit",
      params: { field: "title" },
    }),
    true
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "blog_posts",
      action: "edit",
      params: { field: "status" },
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
    canAccessWithSnapshot(snapshot, {
      resource: "blog_posts",
      action: "edit",
      params: { id: 1 },
    }),
    true
  );
  assert.equal(
    canAccessWithSnapshot(snapshot, {
      resource: "blog_posts",
      action: "edit",
      params: { id: 2 },
    }),
    false
  );
  assert.equal(
    updateRecordPermissions({
      resource: "blog_posts",
      recordIds: [1, 2],
      allowedActions: {
        view: [1, 2],
        update: [1],
        destroy: [],
      },
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
    {
      ...snapshot,
      data: { ...snapshot.data, strategy: { actions: [] } },
    }
  );
  assert.equal(filteredMenu[0].route, undefined);
  assert.equal(findFirstAccessibleRoute(filteredMenu), "/public-child");

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
