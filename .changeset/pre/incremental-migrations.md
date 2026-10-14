---
'@nocobase/app-skills': patch
'@nocobase/create-plugin': patch
---

Tell agents that a merged migration is never edited, not even reformatted, and that every later schema change, a fix to an earlier migration included, goes in a new migration that sorts after it. The `nocobase-app-development` Skill gains a "Migrations change incrementally" section, and the `AGENTS.md` of a generated plugin states the same rule.
