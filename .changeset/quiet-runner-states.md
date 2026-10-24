---
'@nocobase/app-plugin-agents': patch
---

Retire the pending runner-agent state and obsolete discovery/cleanup interfaces. Migrate unused legacy discoveries away, preserving every referenced record and creation audit as disabled, and mark models as added only for enabled or disabled runner agents. The data migration is irreversible; review custom application references before upgrading. Align all supported Agent page translations with explicit model addition.
