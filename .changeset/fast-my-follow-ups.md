---
'@nocobase/studio': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-agents': patch
---

Make My follow-ups fast for someone who owns many open issues. `GET /api/followUps` reads what every row's progress needs in a fixed number of queries instead of a few per issue, and a row no longer works out why queued work has not been claimed (`waiting`, `managerWait`): the issue's own progress (`GET /api/issueProgress/{issueId}`), shown beside the list, still does. A new `GET /api/followUps/issues?issueIds=…` answers the rows of the named issues, and the page uses it to refresh only the rows an announced change names, a burst at a time, reading the whole overview again only when the list itself changed, on reconnect, for a change that names no issue, and on its fallback poll. The projects plugin's comment queries gain `newestByEach`, the agents plugin's runs gain `openOnEach`, and its run request list takes `subjectIds` and `statuses`.
