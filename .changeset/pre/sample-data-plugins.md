---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/create-plugin': patch
---

Load sample data only when an installation asks for it. A seed declared with `defineSeed({ name, sample: true, run })` runs only when the Seeder is created with `sample: { enabled: true }`; otherwise it is recorded as skipped and never runs on its own. `Seeder` gains `runSamples()`, which runs the sample seeds recorded as skipped, and `record(entry)`, which records an entry no seed file describes. The seed history table gains a nullable `status` column (`executed` or `skipped`), added by the library the next time a run ensures the table; existing rows read as executed. `SeedHistoryRecord` carries `status` and `SeedRunResult` carries `skippedSamples`.

`@nocobase/app-server` enables sample seeds when a run installs the connection — it held no migration or seed history before the run, or a fresh run rebuilt it — and `app.sampleData` is set (`APP_SAMPLE_DATA=true`); the seeds entry of a run reports `freshInstall` and `skippedSamples`. `@nocobase/app-server/sample-data` adds `sampleDataToken`, on which a plugin registers sample data that has to go through services: the application builds it once every provider is ready, under the same condition, and records it in the default connection's seed history as `sample-data:<name>`. The database task operation `sample` runs the skipped sample seeds.

`@nocobase/app-cli` adds `pnpm nocobase db sample`, which runs every sample seed recorded as skipped, then starts the application without serving it and builds the registered sample data that is skipped or not recorded. A deployment refuses it.
