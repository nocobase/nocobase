---
'@nocobase/app-plugin-projects': patch
'@nocobase/studio': patch
---

Allow people with issue comment and edit permissions to mention the issue's project manager, and offer its database name in mention candidates. Refresh open suggestions when candidates load and update active issue views after a manager rename. Reuse ordinary comment wakeups and preserve agent loop prevention, input merging and run limits.
