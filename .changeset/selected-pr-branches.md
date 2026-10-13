---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
---

Start new directories on the earliest associated eligible same-repository open pull request branch, preserving custom branch rules when no PR qualifies. Track head repositories, explain excluded forks and unknown origins, and require compatible runners for PR checkouts. Existing directories preserve actual state; agents may manage branches and ordinarily push within the same repository without rewriting published history.

Cleanup protects every local branch, saved ref, initialized submodule and uncommitted change using fresh authorized remote evidence. Missing or incomplete evidence preserves work, and no run automatically switches a reused checkout or pushes its HEAD at completion.
