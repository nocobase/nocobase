---
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-agent-sessions': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': minor
'@nocobase/app-plugin-authz-restriction-rules': minor
'@nocobase/app-plugin-authz-sharing-rules': minor
'@nocobase/app-plugin-demo-mode': minor
'@nocobase/app-plugin-file': minor
'@nocobase/app-plugin-i18n': minor
'@nocobase/app-plugin-knowledge': minor
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-plugin-notification-providers': minor
'@nocobase/app-plugin-notification-web-push': minor
'@nocobase/app-plugin-projects': minor
'@nocobase/app-plugin-releases': minor
'@nocobase/app-plugin-scheduler': minor
'@nocobase/app-plugin-users': minor
'@nocobase/i18n': patch
---

Add Russian (ru-RU) and Korean (ko-KR) to the plugins Studio uses, and correct terminology in their existing translations: an issue is a task (it was translated as a magazine issue or a problem in several languages), a runtime is an execution environment, Agent and My Agent stay consistent, and an issue's executor and the backlog status read correctly. The remaining English strings in the agents plugin's translations are translated. Calendars follow Russian and Korean, and a browser asking for Traditional Chinese (zh-HK, zh-Hant-TW) now lands on zh-TW instead of zh-CN.
