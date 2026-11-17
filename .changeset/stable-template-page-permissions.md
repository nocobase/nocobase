---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Make Home an explicit page permission in both application templates and redirect users whose Home access is denied to an accessible page. Register core role and user administration in the default template from its first run. Ship route and live catalog contract tests so new applications catch missing page permissions, reused page IDs and stale business permission selections before delivery.
