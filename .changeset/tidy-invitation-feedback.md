---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
---

Expose invitation email failures in client types, project create and resend responses, localized invitation dialogs, and default CLI output. Preserve complete manual invitation links in nested batch results. API emailError messages now use English, while the invitation page translates them into the selected language.
