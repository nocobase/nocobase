---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Declare the templates' System settings with `defineSettingsRoutes()` and switch the sidebar to a settings menu on `/settings` pages. The Settings entry now stands apart at the bottom of the business menu; on any settings page the sidebar shows Back, returning to the page the viewer left, followed by each category over the modules the viewer may open, in the mobile drawer as well. The settings home, categories, Users, Permission management, Database Explorer and Notifications are settings routes, and settings pages contributed by plugins join the same menu. Examples moves its settings pages under `/settings` (`/settings/users`, `/settings/roles`, `/settings/default-access`, `/settings/workflows`, `/settings/knowledge/indexing`) and redirects the former URLs, keeping the path, query and hash. Closing a default data scope form now returns to the list wherever it is mounted.
