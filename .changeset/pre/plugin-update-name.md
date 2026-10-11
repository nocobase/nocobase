---
'@nocobase/app-cli': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Replace the `plugin update --plugin` flag with an optional plugin name argument, supporting full package names and short names while preserving updates of all registered plugins when no name is supplied.

Document the positional plugin update command, version-range behavior, and Skills synchronization in all three application templates' README, agent guidelines, and development Skill.
