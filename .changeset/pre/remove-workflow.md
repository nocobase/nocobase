---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-skills': patch
'@nocobase/app-cli': patch
'@nocobase/i18n': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/dev-config': patch
'@nocobase/create-plugin': patch
---

Remove the Workflow plugin from the repository

`@nocobase/app-plugin-workflow` was already disabled in every template; it is now deleted and will not be released again. Record lifecycles built with `@nocobase/lifecycle` take its place for business processes, and the Workflow pages of the documentation now describe them.

Breaking for the Default and Examples templates: they no longer depend on `@nocobase/app-plugin-workflow` and drop `server/config/workflow.ts`, the `workflows` directory in `files`, and the TypeScript and ESLint settings for workflow packages. The Examples template also drops its flow examples: its `workflows` directory, the quotation review task API under `/api/quotationReviewTasks`, the waiting-task pages under `/workflow/waiting-tasks`, and the two schedules that ran the analytics report and the scheduled test flow. A new migration, `202610100001_drop_review_tasks_and_daily_reports`, drops the `quotationReviewTasks` and `exampleDailyReports` tables nothing uses any more. Workflow rows an existing database already holds stay where they are, since no remaining plugin owns them. An application that still uses the plugin keeps its dependency on the last published version, whose peer ranges will stop accepting the runtime as it moves on.

The scheduler no longer describes a `workflow` target or ships labels for it; every schedule points at a target the application or a plugin registers with `registerTarget()`, and an unlabelled target type or reason is shown as it is. The application development, deployment and upgrade Skills no longer route approvals to the plugin, describe its wait node, its Artifacts after a production build or its pages, and their examples use other plugins. The command help of `@nocobase/app-cli`, the i18n Skill, and the plugin scaffold's guidance use other plugins as examples too.
