---
'@nocobase/db': patch
'@nocobase/app-skills': patch
---

Explain in the database and application development Skills that `upsertOne` needs a non-empty `update`, and that a seed creating a record only when it is missing checks `exists` before `createOne`, so generated sample seeds no longer stop the first start with `update: {}`.
