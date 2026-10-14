---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': patch
---

The default template's homepage now explains that the application is developed by describing requirements to a coding agent, with a sample request to copy, and lists the built-in capabilities (authentication, permissions, scheduled tasks, notifications, mail, files, template printing, languages and themes) as cards. Each card opens a dialog with ready-made prompts that can be edited and copied; edits are not saved once the dialog closes.

Both templates now keep their own copy in `client/locales/system/`, which `client/locales/en-US.ts` and `zh-CN.ts` spread before the application's groups, so a template upgrade can replace the system copy without touching the application's. An application that extends a shared group such as `navigation` spreads the system group first. To upgrade an existing application, take the template's `client/locales/system/` and reduce each application locale file to the spread followed by the groups the application added; the `nocobase-app-upgrade` Skill describes the steps, and the frontend references of `nocobase-app-development` describe the new layout.
