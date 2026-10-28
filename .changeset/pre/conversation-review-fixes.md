---
'@nocobase/app-plugin-agents': patch
---

A message the owner sends also announces the conversation without a `seq` once it settles what waited for them, so a listener that settles notices on `conversation.changed` (such as an application's inbox) hears that a reply was answered from the CLI or any surface that does not mark it seen. A run that fails after asking its owner a question now waits as `failed` rather than keeping the question. A runner's empty workspace report no longer forgets every session's directory, since it more likely means the runner could not read them. Tying a record a conversation already has answers `200` instead of `201`.
