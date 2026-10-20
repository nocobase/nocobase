---
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Declare database dialect drivers on the application's own database config.

An application lists the dialect packages it installs under `database.drivers`,
next to the connections that use them, and the runtime, the CLI commands and the
tests all resolve a dialect from that one place. The app-server runtime stays
independent of every concrete database driver.

This replaces the process-wide `registerAppDatabaseDrivers` registry and the
`databaseDrivers` option on `Application`, both of which are removed. An
application that used either one moves its drivers into `database.drivers` and
drops the module it imported only for the registration side effect.
