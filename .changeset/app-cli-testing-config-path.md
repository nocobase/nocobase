---
'@nocobase/app-cli': patch
---

`bindAppCommand()` from `@nocobase/app-cli/testing` accepts `configPath`, the configuration file the application loads instead of its default, handed over the way `APP_CONFIG_FILE` is. A command's test can point the application at a configuration of its own, such as one naming a test database.
