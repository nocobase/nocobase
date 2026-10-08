---
'@nocobase/app-plugin-projects': minor
---

Add `@nocobase/app-plugin-projects`: projects, issues, workflows, labels and members for a NocoBase application. Issues carry workflow states, assignees of pluggable kinds (people, the plugin's own rules, or kinds another plugin registers, such as agents), sub-issues and dependencies, comments with reactions, attachments and activity; operation plans let a person confirm, rehearse, execute and undo a batch of changes proposed for them; intake splits and extracts issues from text and files. Business permissions are declared in `shared/access.ts` (the `pm` resource type, `edit.related` and `edit.all` levels) and resolved by the assembling application through `projectsAccessToken`. Every route is documented with command-line hints, and the client exports headless hooks (`client/kit`, `client/issues`) for the UI Library's project and issue blocks.
