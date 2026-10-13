---
"@nocobase/agent-runner": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/studio": patch
"@nocobase/studio-cli": patch
---

Start issue runs from the earliest linked open pull request in the same repository, allow agents to manage branches and pull request associations without rewriting pushed history, and preserve shared local branches and stashes when removing run worktrees. Only published runner-created temporary branches are cleaned up.
