---
'@nocobase/app-cli-client': patch
'@nocobase/app-server': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-users': patch
---

Show optional settings permissions separately from business actions in CLI identity output, and explain run-token-only permissions. Add available-command typo suggestions, a hint for truncated text, and clean shutdown when a pipe closes early. Describe route schema inputs so generated CLI help and reference tables explain their parameters. The manifest identity and whoami JSON result gain an optional settings list; command admission and authorization are unchanged.
