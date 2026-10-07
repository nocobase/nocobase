---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-template-hub': minor
'@nocobase/app-skills': patch
---

The application header shows the current page's breadcrumb after the sidebar toggle, in place of the "AI application workspace" (Hub: "Hub console") tagline, whose `shell.workspace` (Hub: `navigation.console`) locale key is removed. `Breadcrumbs` is now rendered by `AppLayout` and `SettingsLayout` rather than placed by pages: it shows the route trail — routes declaring `breadcrumb`, and menu pages by their `navigation.title` — leaves out pages the viewer may not open, or shows the whole trail a page declares with `usePageBreadcrumb` from `@nocobase/app-client`. On a phone only the last level shows, and a medium screen folds the middle levels into a menu. The templates gain the shadcn `breadcrumb` primitive. The examples' child pages no longer render their own trail. The application development Skill describes the header trail and when a page still needs `BackButton`.

An existing application adopts this by merging the template's `client/components/breadcrumbs.tsx`, `client/components/ui/breadcrumb.tsx`, `client/layouts/app-layout.tsx` and `client/layouts/settings-layout.tsx`, and removing `<Breadcrumbs />` from its pages.
