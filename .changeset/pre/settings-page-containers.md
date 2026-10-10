---
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-dag-flow': patch
'@nocobase/app-plugin-notification': patch
---

Use plugin-owned PageContainer components to unify settings page width, spacing, and responsive padding across database exploration, user management, API keys, workflows, and notification logs.

Use plugin-owned PageHeader components for consistent titles, descriptions, and page actions while preserving permission checks and workflow detail navigation.

Preserve spacing below workflow tabs and wrap workflow list filters and actions on narrow screens.

Restore spacing between workflow detail back links and headings, and keep execution duration cells aligned when table rows grow.
