---
'@nocobase/app-skills': patch
---

The `nocobase-deployment` Skill now offers `@nocobase/app-installer` for a standalone deployment on a server without a Hub or containers: it installs the application's deployment archive, upgrades to a new one with a backup and an automatic rollback, and is driven by the global `nocobase-app-installer` Skill. An unmodified Hub is installed with the same package's `--template hub`. The `nocobase-app-development` Skill names `APP_STORAGE_DIR` as the standalone storage variable.
