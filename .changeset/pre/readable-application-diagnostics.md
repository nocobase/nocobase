---
'@nocobase/logging': patch
'@nocobase/app-server': patch
'@nocobase/app-host': patch
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
