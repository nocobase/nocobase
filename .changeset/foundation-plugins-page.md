---
'@nocobase/app-plugin-foundation': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': patch
---

Replace the App Foundation overview with a Plugins page under System settings › System (`/settings/plugins`): the plugins an application uses, their versions and states, grouped as enabled and not enabled, with the plugins needing attention first and the commands that enable, update or disable each one. It reads `GET /api/foundation/plugins`, and both the page and the API require the new «Plugins · View» settings item (`foundation.plugins` / `read`) instead of unrestricted access. The earlier `/settings/foundation` and `/settings/capabilities` addresses open the new page.

Removed: the capability overview, the Features and extensions guide and all of its detail pages, the source, API and database scans with their evidence, module matrix and record counts, the saved snapshots and background scan, the `foundation modules build` command and its `afterServerBuild` hook, the `foundation` configuration section with `FOUNDATION_SCAN_ON_START`, the `page:capability-guide` grant, and the `./capability-guide`, `./cli`, `./config` and `./client/pages` exports together with `CAPABILITY_GUIDE_ACCESS`, `groupFoundationNavigation` and the client factory's options. A new migration drops the `foundationSnapshots` table. Both templates register `foundation()` without options, no longer register the plugin's CLI or its configuration section, and the default template's home page no longer shows the built-in capability cards.
