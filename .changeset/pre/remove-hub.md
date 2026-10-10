---
'@nocobase/app-installer': minor
'@nocobase/create-app': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': minor
'@nocobase/app-cli': patch
'@nocobase/app-server': patch
'@nocobase/app-testing': patch
'@nocobase/create-plugin': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-users': patch
---

Remove NocoBase Hub. `@nocobase/app-plugin-hub`, `@nocobase/app-template-hub` and `@nocobase/hub-cli` are no longer published, and every package that offered or described the Hub drops it.

Breaking for `@nocobase/app-installer`: it installs, upgrades and rolls back from a deployment archive only. `install --template`, `install --keep-source`, `upgrade --to`, `upgrade --rebuild`, `upgrade --keep-source` and `status --offline` are removed, as are the `latest` and `updateAvailable` members of the `status` result and the `rebuilt` and `notes` members of the `upgrade` result. An installation an earlier version built from the published Hub template is refused with `STATE_UNSUPPORTED`; manage it with the app-installer version that installed it. The error codes that only a template build reported (`PNPM_MISSING`, `PNPM_UNSUPPORTED`, `REGISTRY_UNREACHABLE`, `VERSION_NOT_FOUND`, `DISK_LOW`, `CREATE_FAILED`, `DRIVER_INSTALL_FAILED` and `BUILD_FAILED`) are no longer produced, and pm2 always kills the process tree of an application it stops.

Breaking for `@nocobase/create-app`: `--template hub` is no longer a template name, and a generated application no longer gets a `.env`.

The Default template no longer depends on `@nocobase/hub-cli`, so an application generated from it has no `pnpm nocobase hub` commands. An application upgraded from an earlier version that published to a Hub removes the dependency with `pnpm nocobase package remove @nocobase/hub-cli` and deletes `.nocobase/hub.json`; the `nocobase-app-upgrade` Skill describes the steps. The application Skills, the plugins' documentation and the in-app test notification text no longer mention the Hub.
