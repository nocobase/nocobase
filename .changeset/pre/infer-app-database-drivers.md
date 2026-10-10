---
'@nocobase/app-server': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add `defineAppDatabaseConfig` to infer connection types from the drivers returned by a runtime configuration callback. Application templates now directly export this helper without explicit factory annotations, driver type maps, or `satisfies` clauses. Keep declaration emission but use full TypeScript inference for application server builds; library packages retain isolated declaration checking.
