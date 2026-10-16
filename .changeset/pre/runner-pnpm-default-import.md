---
'@nocobase/agent-runner': patch
---

Runs no longer force pnpm to copy packages from the shared store where the file system cannot clone, and use pnpm's default import method instead: packages are cloned where supported and hard-linked elsewhere, so a run on ext4 no longer copies its whole `node_modules`. The workspace notes tell the agent never to edit files under `node_modules` in place and to use `pnpm patch` instead.
