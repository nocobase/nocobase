---
"@nocobase/app-plugin-agents": patch
---

Keep conversation agent identifiers non-null with a default sentinel, keep historical conversations readable and read-only while permitting owners to cancel unfinished old runs, and allow application shutdown to complete with a warning if OnlineAgent finalization fails. Persist tool messages using the existing display roles while retaining their canonical SDK roles. Prefix OnlineAgent integration types, narrow server exports, and document the service and configuration API in the plugin Skill.
