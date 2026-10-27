---
"@nocobase/app-plugin-agent-sessions": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-api-keys": patch
"@nocobase/app-plugin-authorization-example": patch
"@nocobase/app-plugin-authz-default-access": patch
"@nocobase/app-plugin-authz-restriction-rules": patch
"@nocobase/app-plugin-authz-sharing-rules": patch
"@nocobase/app-plugin-database-explorer": patch
"@nocobase/app-plugin-file": patch
"@nocobase/app-plugin-file-example": patch
"@nocobase/app-plugin-foundation": patch
"@nocobase/app-plugin-knowledge": patch
"@nocobase/app-plugin-lifecycle-example": patch
"@nocobase/app-plugin-mail-example": patch
"@nocobase/app-plugin-notification": patch
"@nocobase/app-plugin-notification-web-push": patch
"@nocobase/app-plugin-office-flows-example": patch
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-releases": patch
"@nocobase/app-plugin-repository-example": patch
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/create-plugin": minor
---

Publish editable file upload/preview and notification delivery-log UI through the UI Library. Install `@nocobase/file-component-ui` or `@nocobase/notification-logs-ui` with shadcn, and merge their bundled locale resources into the consuming application. Existing application-owned copies remain usable; reconcile upstream changes while preserving customizations. The default template keeps its File UI installation path and now tracks the UI Library source.

Remove plugin-owned Registry recipes, their build/materialize commands, the Registry example plugin, and the `registry` capability from the plugin scaffold. Plugins can continue to install UI Library items into their own client source. Update plugin development guidance to use this single source distribution channel.

Preserve custom file download callbacks for images opened from FileList, including preview toolbar and fallback downloads.
