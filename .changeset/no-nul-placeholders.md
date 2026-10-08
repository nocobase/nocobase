---
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-releases': patch
---

On PostgreSQL, a member who may see no project, no issue or no App no longer gets a server error: the filters used a NUL character as a placeholder id that matches nothing, which PostgreSQL refuses. The releases plugin's App list, for one, answered 500 to every member who had created no App.
