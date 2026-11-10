---
"@nocobase/drive": minor
"@nocobase/app-server": minor
"@nocobase/app-plugin-file": minor
"@nocobase/app-plugin-projects": minor
"@nocobase/app-plugin-agents": minor
"@nocobase/app-template-examples": patch
"@nocobase/app-skills": patch
---

Configure per-disk upload limits through Drive, validate issue, comment and conversation attachments with shared File helpers, and use the same limits for issue, comment and conversation upload checks and messages.

Conversation attachment size errors now use `FILE_TOO_LARGE` in the `file` domain instead of `UPLOAD_TOO_LARGE` in `agents`. Online Agent attachment reading follows the stored disk limit.

Upload limits are embedded in the page’s public configuration, so client startup requires no separate upload-policy request.
