# @nocobase/plugin-multi-portal

`@nocobase/plugin-multi-portal` is the commercial portal/permission layer built
on top of `@nocobase/plugin-ui-layout`. A portal selects an enabled UI Layout
and adds portal-scoped access and desktop route/menu permissions for roles.

UI Layout remains the open-source layout/route base. Multi-portal does not
replace the UI Layout registry; it composes with it to create isolated portal
entry points and permission boundaries.

The `authCheck` route option is not a complete public-access solution. Public
portals or layouts must be implemented by plugin code that explicitly registers
the route and provides matching public APIs, permission boundaries, and resource
validation.
