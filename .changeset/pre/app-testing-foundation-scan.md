---
'@nocobase/app-testing': minor
---

`createTestAppConfig()`, and so every application `createTestApp()` and `createAppTest()` start, no longer writes `foundation: { scanOnStart: false }`: App Foundation no longer scans the application, so the section is gone. A `foundation` section a test passes in `config` is written as given.
