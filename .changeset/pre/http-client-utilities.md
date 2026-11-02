---
"@nocobase/app-client": minor
"@nocobase/app-plugin-agent-sessions": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-releases": patch
"@nocobase/app-skills": patch
---

Support plain HTTP origins when creating session and upload identifiers or copying text. Provide shared browser UUID and clipboard helpers so draft, submission and invitation actions work without secure-context APIs.

Document capability checks and user-facing explanations for secure-context browser features, require HTTP-compatible UUID and copy actions, and return an explicit copy result for localized recovery UI.
