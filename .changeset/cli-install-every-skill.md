---
"@nocobase/app-cli-client": minor
---

Make `skills install`, `skills status` and the Skill synchronization in `update` handle every Skill a branded CLI package ships, discovered from `skills/*/SKILL.md` at run time, instead of only `nb-studio-cli`. The installation record `skills.json` becomes `{ version: 2, targets }` with a `skill` on each target; the original single-Skill file is still read and migrated on the next write. The result gains a `skills` list and a `skill` on each target. When an update no longer ships a Skill, its registered copy is removed only if it still matches what was installed; an edited copy is kept with a warning.
