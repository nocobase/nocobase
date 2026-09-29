---
'@nocobase/create-app': patch
'@nocobase/app-cli': patch
---

Exclude the optional `msgpackr-extract` native accelerator from generated applications and deployment output using pnpm's `ignoredOptionalDependencies` setting. BullMQ continues to use msgpackr's JavaScript implementation without installing the accelerator or its platform binary packages.
