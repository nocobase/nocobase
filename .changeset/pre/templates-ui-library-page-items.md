---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

`PageContainer`, `PageHeader`, `RouteDialog`, `RouteDrawer`, `RouteChildPage` and `useRouteOverlay` now come from the NocoBase UI Library, which publishes them as the `page-container`, `page-header`, `route-dialog`, `route-drawer` and `route-child-page` components, and plugins install those instead of copying template files. They stay in `client/components/` under the same names and import paths. The template copies now match the library: exports carry explicit types, every component merges class names with `cn` from `@/lib/utils`, and the route overlays' close button is translated under `routeOverlay.close` rather than `actions.close`. Existing applications need no change; to adopt the library versions, run `npx shadcn@latest add @nocobase/page-container @nocobase/page-header @nocobase/route-dialog @nocobase/route-drawer @nocobase/route-child-page`, let it overwrite each copy you have not customized, and add `routeOverlay.close` to `client/locales/`.
