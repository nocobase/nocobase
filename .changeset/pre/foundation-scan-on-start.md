---
'@nocobase/app-plugin-foundation': minor
'@nocobase/app-testing': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

App Foundation's `foundation.scanOnStart` setting (`FOUNDATION_SCAN_ON_START`, factory `defineFoundationConfig()` from `@nocobase/app-plugin-foundation/config`) turns off the background scan an application submits at start; it defaults to `true`. With it off, opening the page, Refresh and Count records still start a scan. `createTestAppConfig()` in `@nocobase/app-testing` sets `foundation: { scanOnStart: false }` for every test application, so tests no longer spend seconds of CPU on the scan or wait for it when the application closes; pass `config: { foundation: { scanOnStart: true } }` to keep it. Both templates register the `foundation` section.
