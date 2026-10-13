---
'@nocobase/app-cli-client': minor
---

Add `<bin> acp start`, which connects the computer to the signed-in person's agent sessions (`@nocobase/app-plugin-agent-sessions`) and keeps it connected until stopped, running their sessions with the coding agents installed there, and `<bin> acp service install`, `status` and `uninstall`, which keep it connected in the background from every login as a launchd agent on macOS, a systemd user unit on Linux or a Startup script on Windows. One bridge runs per profile on a computer. The person chooses the folders sessions work in from the application; `--root` limits them on the computer itself (the home directory by default).
