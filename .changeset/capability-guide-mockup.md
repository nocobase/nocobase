---
'@nocobase/app-plugin-foundation': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add a capability guide at `/capabilities` listing every core module and plugin the application declares in its `package.json`, examples and Skill-only plugins included. It shows all of them mixed and numbered, filtered by All, Core or Plugins together with keywords; each entry explains the business problem, typical situations and prerequisites, offers editable prompts with a filled-in example, links a demo only when an example plugin registers it, and keeps technical details in a folded developer reference. The default home page features entries from the same catalog and links to the full guide. The App foundation page keeps its URL and access, now titled App usage.
