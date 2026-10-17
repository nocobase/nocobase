---
'@nocobase/app-plugin-projects': patch
---

Read the authorized issue hierarchy in a fixed number of queries whatever the number of issues: which issues wait for unfinished ones takes two queries instead of several per hundred issues, exact list filters are matched on the issues already read, and `hierarchyItems` hydrates up to 500 issues at once and accepts the readable ids its caller has already read. A change of an issue's project, parent or executor is now announced as one that moves lists, and the projects list is refreshed only for announcements that name no issues, the only ones that can change its counts. Saving an issue no longer refreshes its detail twice when the page reads it by id.
