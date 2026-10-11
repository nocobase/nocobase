---
'@nocobase/app-cli': patch
'@nocobase/create-app': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Mirror every synchronized skill into `.claude/skills/` as a relative symbolic link, so Claude Code discovers the skills an application's NocoBase packages ship. Claude Code reads only `~/.claude/skills/` and `<project>/.claude/skills/`, so a synchronized `.agents/skills/` was invisible to it while globally installed NocoBase 2 skills stayed available. Removing a package or a skill drops its link, application-owned entries are left alone, and a real directory occupying a `nocobase-` name is reported rather than overwritten. Ignore the generated mirror in the template and generated `.gitignore` files alongside `.agents/`.
