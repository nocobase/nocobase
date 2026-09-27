---
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
---

The authorization Skills are self-contained: they no longer send readers to the example plugins or rely on their sample ids, and use a neutral `org.team` subject type in their snippets. Organisation work, such as departments, positions and department heads, is routed to the application development Skill's organisation reference, and each rule plugin's Skill links its permission design guide for department baselines, cross-department sharing and department-assigned restrictions, noting that the guide's core needs permission sets alone.
