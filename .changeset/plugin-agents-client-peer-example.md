---
'@nocobase/create-plugin': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-repository-example': patch
---

Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
