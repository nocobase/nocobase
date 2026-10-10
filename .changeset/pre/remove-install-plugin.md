---
'@nocobase/app-template-default': major
'@nocobase/app-template-examples': major
'@nocobase/app-plugin-authentication': major
---

Remove `@nocobase/app-plugin-install` and the install mode it existed for. Configuration is written by `nocobase app config init` before an application is started.

The plugin redirected an application to `/install` whenever the authentication secret was the temporary one the runtime invented for an application with no configuration file. That page could never be reached from an application made by `create-app`, which always wrote a `config.yml` and so never entered install mode; it was undocumented, and a Hub-hosted application receives its configuration from the Hub instead. With the templates no longer shipping a configuration file at all, an unconfigured application has no database driver decision made either, and nothing left to serve the page with.

`resolveAuthSecret` no longer takes the application root and no longer invents a secret. A secret generated at boot is different on every restart, which silently invalidates every session; a missing one is now an error that names the command which writes it. Applications upgrading from an earlier version remove `@nocobase/app-plugin-install` from `package.json` and drop its entries from `client/plugins.ts` and `server/plugins.ts`; applications that had come to rely on the installation page configure themselves with `pnpm config:init` instead.
