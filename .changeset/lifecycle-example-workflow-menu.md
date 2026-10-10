---
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-template-examples': patch
---

Reorganize the examples application's menu around workflows. The menu group of `@nocobase/app-plugin-lifecycle-example` is now called **Workflow** (工作流 in Chinese) instead of **Lifecycle Example**, and uses the workflow icon. The group of `@nocobase/app-plugin-office-flows-example` is now called **Workflow: Lightweight Approval** (工作流：轻量审批) instead of **Office Flows Example** and uses a stamp icon, and the group of `@nocobase/app-plugin-jobs-example` uses a cog icon, so neither shares the workflow icon any more. The examples template no longer has its own **Workflow** menu group or the **Waiting tasks** pages under `/workflow/waiting-tasks`, which went with the Workflow plugin.
