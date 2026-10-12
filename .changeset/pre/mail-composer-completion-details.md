---
'@nocobase/app-plugin-mail': patch
---

Add optional fourth-argument completion details to MailComposer and MailWorkspaceComposer, preserving existing callback arguments. Details include every submission returned by that operation and a detached snapshot of the actual client request, or a separate saved-draft reference. Preserve pending, scheduled, failed and unknown statuses; a transport failure without a response has no submission IDs. Support asynchronous completion callbacks and isolate integration errors through optional onCompletionError without delaying closing, changing the send outcome or retrying mail. Business integrations should associate and deduplicate by submission ID rather than querying the latest sending record; this client callback is not a durable delivery event.
