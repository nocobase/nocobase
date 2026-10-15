---
'@nocobase/studio': patch
---

My tasks and the grouped issue lists read far less: each `/api/taskGroups` request reads the hierarchy, waits and follows once and hydrates every row it answers in one read, outside a transaction; the summary is assembled once and reused per viewer for five seconds; children of several expanded tasks are read in one request (`GET /api/taskGroups/children?parentIds=`, which now answers a page per parent); a new `GET /api/taskGroups/rows` answers single rows with the lists' membership; and unread counts of followed tasks are one grouped count.
