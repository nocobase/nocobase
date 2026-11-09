---
"@nocobase/app-server": minor
"@nocobase/app-cli": patch
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Add registration-ready database task preparation hooks, reset selected databases before hooks on fresh runs, and correct the templates' Snowflake worker ID range.

Execute database task plans through explicit preparation, reset, hook and business steps. Report prerequisite failures independently of unstarted tasks with additive `failure` and `resetConnections` fields; CLI retains its envelope and failure codes and includes the same details. Preserve per-connection fresh ordering without hooks and report completed resets when a later prerequisite fails.

Preserve top-level CLI error connection and task kind details from structured prerequisite failures when no business task has failed.
