---
"@nocobase/app-host": minor
"@nocobase/app-host-docker": minor
---

Back up and restore Apps on a managed Host with their own backup commands, deduplicated by operation ID: in-process Apps through a child process of the Host and Docker Apps through one-off containers on their image and volumes, with both backends reporting the backup capability. A restore refuses an incomplete backup, another release or an archive that does not verify before it stops the App, and is not repeated once its data is back; a restore that fails or is cancelled after that keeps the record that its data was restored.
