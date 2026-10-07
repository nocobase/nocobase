---
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-hub': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-workflow': patch
'@nocobase/app-plugin-ai-employee-example': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-notification-example': patch
'@nocobase/app-plugin-registry-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-template-print-example': patch
---

Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
