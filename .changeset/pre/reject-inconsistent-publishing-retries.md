---
'@nocobase/app-template-default': patch
---

Reject configured upload retries that omit the original deployment configuration and report known failed or cancelled deployment retries as CLI failures even without --wait.
