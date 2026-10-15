---
"@nocobase/app-plugin-agent-sessions": major
"@nocobase/acp-bridge": major
"@nocobase/app-cli-client": minor
"@nocobase/app-plugin-projects": minor
"@nocobase/studio-cli": patch
"@nocobase/studio": patch
---

Replace the built-in agent session MCP endpoint and tool registration API with the Studio CLI and shared Skill. Bridge protocol 3 requires a matching CLI upgrade. Session agents use the bridge-selected login profile, validate session ownership before creating linked tasks, default to the session project and Backlog, and read linked work and issue progress through CLI routes. Prepare the shared Skill before starting or restoring sessions and explain unsupported agents or installation failures. Teach both bundled Skill copies to discuss and search before recording work and combine related requirements into as few tasks as practical.
