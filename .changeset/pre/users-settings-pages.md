---
'@nocobase/app-plugin-users': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Ship the User management pages with `@nocobase/app-plugin-users`: registering `users()` now adds the user list at `/settings/users`, the New user dialog and the Edit user drawer to the Accounts and permissions category of System settings, with the same paths, route names, page access and behavior the templates had. The client entry exports `USERS_ROUTE_ID`, `USER_CREATE_ROUTE_ID` and `USER_EDIT_ROUTE_ID`, so an application can replace any one of these pages through `routeComponentOverrides` while the others stay the plugin's, and exports `UserForm` and `RoleSelection` for replacement pages. The templates no longer contain their own copy of these pages. An application created from an earlier template removes its `settingsUsers` route entry, or turns its customized copy into a route override, before updating; otherwise `/settings/users` is registered twice.
