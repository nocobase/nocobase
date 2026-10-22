---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Guide application builders to assign business roles to explicit users and keep assignments visible and editable in administration. Require an explicit request and management controls before introducing a global default role. Ship an isolated application initialization test that rejects unexpected wildcard role assignments and hidden business grants in the inherited member role.
