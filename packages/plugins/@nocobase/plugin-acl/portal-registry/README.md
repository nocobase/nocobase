# NocoBase ACL UI

Reusable ACL composition components for the NocoBase Refine starter.

After installation, import the components from `@/extensions/nocobase-acl`.

- `AclPage` combines page-level permissions.
- `AclRegion` hides or replaces individual data regions.
- `AclField` applies NocoBase field whitelists.
- `RoleSwitcher` can be placed in any application surface. It supports
  normal roles, Anonymous when enabled, and Full permissions through the
  `__union__` role when the system role mode allows it.

Mark non-collection resources with `meta.acl.type = "authenticated"`, or use
the `collection`, `snippet`, and `route` ACL metadata variants when the resource
should participate in NocoBase permission checks.

The underlying `accessControlProvider`, `roles:check` cache, record permissions,
and Refine integration are provided by the compatible Starter.
