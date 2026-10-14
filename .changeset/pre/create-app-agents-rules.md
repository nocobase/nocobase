---
'@nocobase/create-app': patch
'@nocobase/app-cli': patch
---

Generated applications now commit `.agents/rules/`, the application's own agent guidance, while the rest of `.agents/` stays ignored: `create-app` writes `/.agents/*` followed by `!/.agents/rules/` instead of `/.agents/`, and replaces a legacy `/.agents/` or `.agents/` line in a template's `.gitignore` rather than appending beside it, since git cannot re-include a path inside an excluded directory. The skills sync documentation now states that only `.agents/skills/` and its ownership file are generated state. An existing application that wants to commit `.agents/rules/` replaces `/.agents/` in its own `.gitignore` with those two lines.
