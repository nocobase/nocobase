---
'@nocobase/app-plugin-dag-flow': minor
'@nocobase/app-plugin-dag-flow-example': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-skills': patch
'@nocobase/app-cli': patch
'@nocobase/i18n': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/dev-config': patch
'@nocobase/create-plugin': patch
'@nocobase/app-plugin-ai-employee-example': patch
---

Rename `@nocobase/app-plugin-workflow` to `@nocobase/app-plugin-dag-flow` and keep it as an archived package that nothing else uses. Every entry point keeps its subpath (`/client`, `/server`, `/cli`, `/build`, `/vite`, `/dsl`), so an application that keeps using it replaces the package name in its `package.json` and imports. Because a plugin's CLI topic, i18n namespace, route ids and Skill names are derived from its package name, they change with it: the commands are now `nocobase dag-flow check` and `nocobase dag-flow build`, translations and route ids use the `@nocobase/app-plugin-dag-flow` namespace, and the plugin's Skill is `nocobase-app-plugin-dag-flow`. The plugin's collections, HTTP routes and service tokens are unchanged. Applied migrations are matched by name, so an existing application does not rerun them after switching packages; their history rows keep `@nocobase/app-plugin-workflow` as the recorded package.

A plugin can now ship workflow packages to every application that installs it. It registers them with `workflowSourcesToken` from a provider's `register()`, listed after `@nocobase/app-plugin-dag-flow`, usually through `pluginWorkflowSources({ owner, baseDir, directory })`, which offers the packages under `<directory>` and the Artifacts under `dist/<directory>` from a source checkout, and only the Artifacts from a published plugin running from its `dist`. Outside production the loader compiles a contributed source tree on demand as it does the application's `workflows`; in production it reads built Artifacts, which the plugin's own build writes with `buildApplicationWorkflows()`. A workflow key must be unique across the application and every plugin, and discovery fails, naming both owners, when two offer the same key.

Add `@nocobase/app-plugin-dag-flow-example`, which ships four DAG flows this way: quotation routing that creates a human review task and waits for its decision, a daily analytics report over seeded campaign metrics, failure diagnostics that fails on purpose, and a scheduled wait. Its migration creates `dagFlowExampleReviewTasks`, `dagFlowExampleDailyMetrics` and `dagFlowExampleDailyReports`, a seed fills the metrics, and `/api/dagFlowExample/reviewTasks` lets a signed-in user list and read the review tasks and submit a decision that resumes the run. With `@nocobase/app-plugin-scheduler` registered, the analytics report runs every ten minutes and the scheduled wait every five. Its build compiles the flows and writes their Artifacts to `dist/flows`.

No application template installs `@nocobase/app-plugin-dag-flow` any more. The default application drops its Server, Client and CLI registrations, the `workflow` configuration section, the `workflows` directory in `files`, and the TypeScript and ESLint settings for workflow packages, and the Hub template drops the same unused scaffolding. The examples application also drops its flow examples: its `workflows` directory, the quotation review task API under `/api/quotationReviewTasks`, the two schedules that ran the analytics report and the scheduled test flow, the homepage card and the Automation settings pages; a new migration, `202610100001_drop_review_tasks_and_daily_reports`, drops the `quotationReviewTasks` and `exampleDailyReports` tables nothing uses any more. Workflow rows an existing database already holds stay where they are, since no remaining plugin owns them. An application generated from an earlier template that wants to keep using the plugin re-adds the dependency and registrations itself.

The scheduler no longer describes a `workflow` target or ships labels for it; every schedule points at a target the application or a plugin registers with `registerTarget()`, and an unlabelled target type or reason is shown as it is. The application development, deployment and upgrade Skills no longer route approvals to the plugin, describe its wait node, its Artifacts after a production build or its pages, and their examples use other plugins. The command help of `@nocobase/app-cli`, the i18n and AI employee Skills, and the plugin scaffold's guidance use other plugins as examples too.
