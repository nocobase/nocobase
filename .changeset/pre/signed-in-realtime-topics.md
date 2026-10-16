---
'@nocobase/app-server': minor
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-agents': patch
---

A public realtime topic can be defined with `authenticated: true` (`defineTopic` and `registerTopic` of `@nocobase/app-server/realtime`): subscribing without a signed-in principal is then refused with `AUTHENTICATION_REQUIRED`, as for a user topic, and publishing skips connections without one. The projects plugin's `pm:changes`, the agents plugin's `agents:runners` and Studio's `studio:issues:runs`, whose announcements name records by id, now reach signed-in connections only. The authentication plugin opens the realtime connection again when the signed-in person changes, so a page signed in without a reload receives these topics and user topics.
