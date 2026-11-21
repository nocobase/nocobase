---
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-template-examples': patch
---

Rework a role's detail in Roles and permissions into the Page access, Operations, System settings and Members tabs, followed by the tabs other packages register through `roleTabs`. A composite now names the pages it is used on with `usedOn(...)` and an action the pages that turn it on with `defaultFor(...)`; neither grants anything, and the options routes return both. Checking a page turns on its declared operations at their default scope and says so, each page shows how many of its operations are on and whether it opens empty, each operation lists the pages it is used on and warns when none of them is open, and operations used on no page are grouped under Other operations. System settings pages offer None, View and Manage above their individual switches and mark high-risk actions. Saving a role first reviews every change and marks high-risk grants, and members are added and removed at once. The page explains how roles, default access, sharing and restriction rules combine. The customer and sales examples declare the pages their operations are used on.
