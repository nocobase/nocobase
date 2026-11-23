---
'@nocobase/agent-protocol': minor
'@nocobase/app-plugin-agents': minor
---

Skills expose their `SKILL.md` front matter `metadata`, and an application may bind `skillPolicyToken` to keep skills from being edited, deleted or attached to a scope's defaults through the admin API (403 `SKILL_PROTECTED`). A skill's view reports `canDelete`, and the skill page's settings extension receives the skill and may hide the team default mount.
