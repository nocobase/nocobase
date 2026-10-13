---
'@nocobase/app-cli-client': minor
---

Add `<bin> acp start`, which connects the computer to the signed-in person's agent sessions (`@nocobase/app-plugin-agent-sessions`) and keeps it connected until stopped, running their sessions with Codex or OpenCode. The person chooses the folders sessions work in from the application; `--root` limits them on the computer itself (the home directory by default).
