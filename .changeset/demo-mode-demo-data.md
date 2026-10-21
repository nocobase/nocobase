---
'@nocobase/app-plugin-demo-mode': patch
---

Add demo data to the Demo Mode plugin: an application registers one dataset on `demoDataToken`, and administrators import, clear and reset it through `/api/demoMode/data` (or a configured Scheduler reset that also runs in read-only mode). The plugin claims and tracks every import in `demoModeDatasets` and `demoModeRecords`, rolls failed imports back, creates and removes the demo's accounts, roles and assignments, dates data relative to the import, and adds a simulated OpenAI-compatible `Demo model` service as the default chat model so agents answer from the dataset's scripts instead of a real model. `useDemoData()` from `./client/demo-data` drives an application's own demo page.

Add `demo-mode data status|import|clear|reset` CLI commands with a safe operation preview and explicit change confirmation. Track account ownership across disable/re-enable cycles, reject existing-account collisions, preserve later model defaults, and reload model credentials after changes in another process. Client status reads retain ordered responses and expose refresh and access failures.

Authorized HTTP lifecycle operations also work in read-only mode without disabling protection for concurrent requests.

Allow authorized lifecycle operations in read-only mode and offer an optional demo-only full-application cleanup hook, separate from import rollback.

Expand the published application Skill with a business dataset adaptation workflow, reproducible daily freshness guidance, cleanup and authorization verification, and explicit separation of simulated model replies from tool and Runner execution.

Demo account specs accept the users plugin's `roleScopes`, applied again when an import reuses an account, and a dataset can set `keepAccounts` to disable its accounts on clear instead of deleting them, since a deleted account's username stays reserved.
