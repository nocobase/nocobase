---
'@nocobase/app-template-default': patch
'@nocobase/app-skills': patch
---

Wait for the final deployment result by default in app deploy and app upload --deploy. Support --no-wait for asynchronous acceptance, preserve explicit --wait compatibility, and keep upload-only commands independent of deployment polling.
