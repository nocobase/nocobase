---
'@nocobase/studio': patch
---

NocoBase Studio moves into this repository at `packages/apps/studio` and is published as `@nocobase/studio`. A new migration, `202610220010_studio_rename_package`, moves the migration and seed history Studio recorded under its former package name `studio` to `@nocobase/studio`, and rewrites the i18n namespace of workflow definitions copied from its software template; installations upgrade with `nocobase db apply` as usual.
