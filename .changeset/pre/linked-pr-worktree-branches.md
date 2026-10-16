---
"@nocobase/agent-runner": patch
"@nocobase/app-plugin-agents": patch
---

Start issue runs from the earliest linked open pull request in the same repository, allow agents to manage branches and pull request associations without rewriting pushed history, and preserve shared local branches and stashes when removing run worktrees. Only published runner-created temporary branches are cleaned up. A run that ends on another branch is preserved by that branch, without a saved head or push failure on the starting target.
