---
'@nocobase/app-plugin-users': patch
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-template-examples': patch
---

Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.
