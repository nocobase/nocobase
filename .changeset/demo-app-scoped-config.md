---
"@nocobase/app-plugin-demo-mode": patch
---

Add an application-scoped demo configuration factory and rename the writable-table variable to NOCOBASE_DEMO_WRITABLE_TABLES. Remove quick-sign-in and model environment overrides; derive the simulated endpoint automatically and manage model usage through existing UI policies. Applications must register defineDemoModeConfig in their configuration composition.
