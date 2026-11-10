---
"@nocobase/drive": minor
"@nocobase/app-server": minor
"@nocobase/app-plugin-file": minor
"@nocobase/app-plugin-projects": minor
"@nocobase/app-plugin-agents": minor
"@nocobase/app-template-examples": patch
"@nocobase/app-skills": patch
---

Configure per-disk upload limits through Drive, validate files centrally in File Repository, and use the same limits for issue, comment and conversation upload checks and messages.

File Repository `uploadOne` now defaults to the destination disk’s single-file limit plus 64 KiB multipart overhead instead of 5 MiB. `uploadMany` applies the same disk limit plus overhead to the entire request body, in addition to checking each file; explicit action `maxSize` continues to override the request-body limit.

Upload limits are embedded in the page’s public configuration, so client startup requires no separate upload-policy request.
