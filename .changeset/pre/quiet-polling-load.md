---
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-agents': patch
---

Reduce the server load of open issue and My follow-ups pages. Issue change announcements are gathered for a moment and name the issues that changed, so a page refreshes only what it shows of them; Studio announces new runs on an issue, so issue pages, What it waits for, owner handoffs and My follow-ups fall back to a slow poll instead of polling every few seconds; a preview label the server failed to set no longer makes the issue page poll every three seconds. Polled reads check issue visibility without loading the whole issue page (`IssueQueries.visible`), What it waits for reads only the project manager's newest comments (`CommentQueries.newestBy`), My follow-ups shares lookups across its issues, and pull request marks check visibility in one read. A runner heartbeat no longer announces a runner change, waking every waiting claim and refreshing every runtimes page, unless its disk sample moved by a gigabyte, crossed the free-space threshold or changed size.
