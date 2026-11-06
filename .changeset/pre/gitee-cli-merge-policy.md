---
"@nocobase/agent-runner": patch
---

Fix Gitee CLI argument parsing so command-like title and body values, including URL-valued `--body` arguments, pass through without bypassing existing credential and destination guards.
