# @nocobase/plugin-multi-portal

`@nocobase/plugin-multi-portal` is the built-in Portal registration and
permission layer built on top of `@nocobase/plugin-ui-layout`. A Portal stores
its device type in `uiLayoutUid`: `admin-layout-model` means Desktop and
`mobile-layout-model` means Mobile. Portal availability depends on the Portal's
own `enabled` state, not on a matching UI Layout record.

For Client V2, enabled No-code Portals are the only source of registered Portal
routes. Fresh applications use Portal-scoped entry and route permissions.
The fixed Admin and Mobile Portals created while upgrading an existing
application continue to use UI Layout route ownership and role permissions, so
Client V1 and Client V2 share the same route tree without copying ACL data.

UI Layout remains the layout and route-model base, and Client V1 keeps its
existing UI Layout registration behavior. AI Portals remain separate `/x`
entries and do not register No-code layouts in Client V2.

The `authCheck` route option is not a complete public-access solution. Public
portals or layouts must be implemented by plugin code that explicitly registers
the route and provides matching public APIs, permission boundaries, and resource
validation.
