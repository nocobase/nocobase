---
'@nocobase/app-server': patch
'@nocobase/app-skills': patch
---

Allow database reset in automatic Snowflake mode and reset all selected databases before initializing the ID adapter and running business migrations or seeds. Preserve dry-run, manual mode and destructive confirmation behavior; adapters prepare coordination storage during initialization.
