---
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Role permissions are set in two tabs. Menus only decides which menus a role sees in the sidebar, stored as page access apart from every action, and warns when a checked menu's page would open empty because the role cannot view its object. Business objects sets each object's actions and data scope once for every menu that uses it, so an object used by several pages has one setting. Pages declare the objects they use in `permissionWorkspaceSelection.pages`, for reference only, and the Permission check lists the menus a user sees and their actions per object.
