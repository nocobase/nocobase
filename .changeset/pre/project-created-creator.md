---
'@nocobase/app-plugin-projects': patch
---

Name the person who created a project on its `project.created` event (`creatorUserId`, or null when a service account created it), so listeners can set up the new project for its creator.
