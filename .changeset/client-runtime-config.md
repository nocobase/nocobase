---
'@nocobase/app-client': major
'@nocobase/app-server': major
'@nocobase/app-template-default': major
'@nocobase/app-template-examples': major
'@nocobase/app-template-hub': major
'@nocobase/create-app': patch
---

The client reads its runtime values only from the configuration the server renders into `index.html`. The router basename and `resolveAppUrl` take `app.basePath` from that block and throw when the page carries none, `defineAppRuntime` no longer accepts `basename`, and the block is read once per page. The server no longer writes `window` globals: `SpaConfig.runtime` and its `storagePrefix`, `storageType` and `shareToken` settings are removed. The public configuration gains `app.displayName` and `app.version` from the application's `package.json`, which the templates' sidebar footer now shows in place of the `__PORTAL_TEMPLATE_*` constants Vite used to define.

The templates drop `@nocobase/app-portal-sdk`, `assetUrl`, every Vite `define` and `envPrefix`, and register a test setup that renders the configuration block. The `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.
