---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-template-hub': minor
---

Remove the Dev tools surface: the header's "Component examples" link, `DevLayout` and its export from `client/layouts`, and the `dev.*` and `status.loadingDev` locale keys. Pages plugins declare with `defineDevRoutes()` now render inside `AppLayout` at their `/dev/...` paths, without a navigation or header entry, so they are opened by URL; production builds still contain none of them. `AppLayout` takes an optional `devRoutes` prop for them. An application that kept the template's shell can take these changes as they are; one that customised `header-actions.tsx` drops its `showDev` prop.
