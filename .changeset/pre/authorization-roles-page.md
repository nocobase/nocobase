---
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': patch
---

Move the Roles and permissions pages out of the application templates into `@nocobase/app-plugin-authorization`. Its client plugin now registers them in the System settings' Accounts and permissions category, with the Roles and Data rules tabs, the role editor and Default access; an application passes its page catalog, business objects and page titles through the plugin's `pageCatalog`, `workspace` and `pageTitles` options, or leaves the pages out with `routes: false`. Other packages extend the page through `authorizationSettingsToken` from the new `@nocobase/app-plugin-authorization/client/settings` entry point: `pageTabs` adds a top tab, `ruleTabs` a kind of data rule and `roleTabs` a tab of a role's detail. Default access now registers its tab under Data rules this way. The tab bar shows only the tabs the viewer may open. Route names, paths and settings ids are unchanged, so links and existing grants keep working. The templates drop their copies of these pages, components and tests, and the upgrade guide describes the move.
