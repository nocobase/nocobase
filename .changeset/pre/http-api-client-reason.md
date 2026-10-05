---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-template-print-example': patch
---

Pages read a failed request's cause from `ApiClientError.reason`, which replaced `code`.
