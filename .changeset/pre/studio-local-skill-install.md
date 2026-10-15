---
'@nocobase/app-cli-client': minor
'@nocobase/studio-cli': patch
'@nocobase/studio': patch
---

Add offline `skills install` and `skills status` commands for branded CLI packages that ship the nb-studio-cli Skill, with Claude Code and Codex detection, explicit tool selection, dry-run output and content comparison. Register installed locations and synchronize them from the new package after CLI self-update, preserving older copies on replacement failure and reporting synchronization warnings without failing the CLI upgrade. The update JSON payload gains an optional `skills` result and envelope warnings; local Skill commands return their payload under `result.data`. Preserve documented exit codes when static commands fail with JSON output.

Document local installation, Codex's current user Skill directory and legacy-copy behavior, and reinstalling Skills after external CLI upgrades.

Reject nested installation destinations before writing any target, including destinations registered by earlier installs. During self-update, preserve conflicting copies and their records, report warnings, and continue synchronizing unrelated destinations.
