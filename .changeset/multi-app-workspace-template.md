---
"@nocobase/create-app": minor
"@nocobase/app-skills": patch
"@nocobase/app-template-multi-app": patch
---

Add a multi-app template with a complete Main application at the project root and independent children under apps/, including per-application configuration guidance and standard Skills synchronization. Keep commercial plugins as licensed registry dependencies, scope private registry selection to NocoBase packages, and report recoverable installation failures without exposing credential settings.

Ship multi-app development, migration and deployment guidance in the shared app-skills package, route tasks through the existing application development entry, and distinguish static checks from runtime verification.

Resolve Main and child OSS dependencies through native pnpm workspace and catalog packaging, matching the Default template without maintaining duplicate framework version pins.
