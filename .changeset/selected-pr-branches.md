---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
---

Work on the earliest associated eligible same-repository open pull request branch, preserving custom branch rules when no PR qualifies. Track head repositories, explain excluded forks and unknown origins, and require compatible runners for PR checkouts. Preserve local commits and changes while refusing missing or diverged PR branches; instruct agents to push only the checked-out branch without rewriting published history.
