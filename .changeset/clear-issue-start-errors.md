---
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
---

Reject explicit issue start requests that would save into Backlog before allocating an issue number or writing the issue. Clarify the required In progress status in command help. Preserve validated application suggestions from API error metadata in CLI errors without changing the JSON envelope shape.
