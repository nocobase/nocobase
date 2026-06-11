# @nocobase/plugin-ui-layout

`@nocobase/plugin-ui-layout` is the open-source layout/route base for
client-v2 layouts. It stores enabled layout manifests, registers layout route
shells at runtime, and manages layout-scoped desktop route/menu permissions for
base layouts such as AdminLayout and MobileLayout.

The plugin does not provide a public-access layout feature. The `authCheck`
field is kept as a low-level developer capability for route registration, but
disabling it only skips the frontend auth check for the layout shell. Page
menus, blocks, models, data sources, and business APIs still rely on NocoBase
authentication and server-side permission checks.

Use `@nocobase/plugin-multi-portal` when a commercial portal layer is needed on
top of UI Layout. Multi-Portal owns portal entries and portal-specific
permission boundaries; UI Layout remains the shared layout and route
infrastructure.
