---
'@nocobase/app-plugin-agents': minor
---

A person can choose which kind of runner their runs go to first: their own personal runners or the runners shared with the team (`runnerPreference` in the chat preferences, `auto` by default). A run keeps the choice its actor had when it was queued; runners of the other kind wait one more second before taking it, so they still take it when none of the preferred kind can. Claims read nothing more.
