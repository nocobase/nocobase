# NocoBase ACL UI

Reusable ACL composition components for the NocoBase Refine starter.

After installation, import the components from `@/extensions/nocobase-acl`.

- The Starter's `CanAccess` supports role, resource, record, and field checks.
- `AclPage` combines page-level permissions.
- `AclRegion` hides or replaces individual data regions.
- `AclField` applies NocoBase field whitelists.
- `RoleSwitcher` can be placed in any application surface. It supports
  normal roles, Anonymous when enabled, and Full permissions through the
  `__union__` role when the system role mode allows it.

Route resource metadata and `AclPage` accept a `roles` constraint with `anyOf`,
`allOf`, and `noneOf`. Role constraints use the roles in the current effective
ACL context. In union mode this is the set of roles participating in the union;
in single-role mode it is only the selected role. Regions, fields, and actions
continue to use resource permissions.

Use the Starter's `useGetRoles()` hook when application UI needs the same
effective role names. Its result follows the familiar Refine query shape with
`data`, `isLoading`, `isPending`, `isError`, and `error`. `data` is the active
ACL role set, not every role assigned to the signed-in user.

```tsx
import { useGetRoles } from "@/lib/nocobase/acl";

function CurrentAccessContext() {
  const { data: roles, isLoading } = useGetRoles();

  if (isLoading) return null;
  return <span>Effective roles: {roles?.join(", ")}</span>;
}
```

```tsx
const adminRoute = {
  name: "administration",
  meta: {
    acl: {
      type: "authenticated",
      roles: { anyOf: ["admin"] },
    },
  },
};

function AuditLogsRoute() {
  return (
    <AclPage roles={{ anyOf: ["admin", "auditor"] }}>
      <AclRegion resource="auditLogs" action="list">
        <AuditLogTable />
      </AclRegion>
    </AclPage>
  );
}
```

Mark non-collection resources with `meta.acl.type = "authenticated"`, or use
the `collection`, `snippet`, and `route` ACL metadata variants when the resource
should participate in NocoBase permission checks.

The underlying `accessControlProvider`, `roles:check` cache, record permissions,
and Refine integration are provided by the compatible Starter.

The Demo uses the real `CanAccess`, `AclPage`, `AclRegion`, and `AclField`
components. A local `AclPreviewProvider` supplies a static in-memory ACL store
so both allowed and restricted outcomes remain visible without changing the
current user's real roles. It does not replace Refine's access-control context.
Applications use the Starter's root `AclStoreProvider` and production `aclStore`.

Global ACL permissions remain fixed for one page session. Switching roles saves
the selected role and reloads the page so navigation, routes, data access, and
Refine permission queries all start from the same `roles:check` result.
