---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Slim `AGENTS.md` to an index of always-on rules, at most 32 KB, and move template-specific guidance into a committed `.agents/rules/` directory that ships with the template and is linked from that index. Framework-wide guidance is linked from the synchronized `nocobase-app-development` Skill instead of being copied. `CLAUDE.md` now only imports `AGENTS.md`. `.gitignore`, `.npmignore` and `.prettierignore` ignore `.agents/*` except `.agents/rules/`, and `tests/logic/agents-md.test.ts` enforces the size limit and the links. Existing applications that upgrade should change a `/.agents/` line in their `.gitignore` to `/.agents/*` followed by `!/.agents/rules/`.
