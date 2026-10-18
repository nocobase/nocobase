---
'@nocobase/app-plugin-agent-sessions': minor
---

The sessions can be shown in a panel the application draws beside its other pages: `@nocobase/app-plugin-agent-sessions/client/panel` exports `AgentSessionsPanel`, showing one session, a new session or the list with buttons between them and to the full page, and `useLinkedSessions`. The session page, the new session and the list are laid out by their container's width instead of the screen's, so the page itself looks as before. What the application attaches, such as the record the panel was opened beside, shows above the message until removed and goes with it, as a `#` mention or as text. `GET /api/agentSessions/sessions` takes `linked=<kind>:<refId>` to list the viewer's sessions tied to one record.
