---
'@nocobase/app-plugin-agents': patch
---

Retire the pending runner-agent state and obsolete discovery/cleanup interfaces. Migrate unused legacy discoveries away, preserving records with any run, business reference or audit other than automatic system creation as disabled. Ignore creation audits only when action is created and actorUserId is null, regardless of revision or change contents; delete those audits through the existing cascade when removing an otherwise unused agent, and mark models as added only for enabled or disabled runner agents. Deleted agents and their cascaded audits cannot be restored by rolling back the data migration; review custom application references before upgrading. Align all supported Agent page translations with explicit model addition.
