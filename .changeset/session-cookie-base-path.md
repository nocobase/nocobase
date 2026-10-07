---
'@nocobase/app-template-default': patch
---
Scope the `nocobase_session` cookie to the application's public base path by default, so applications sharing an origin under different paths no longer overwrite one another's session cookie.
