---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
---

Work on the earliest associated eligible same-repository open pull request branch, preserving custom branch rules when no PR qualifies. Track head repositories, explain excluded forks and unknown origins, and require compatible runners for PR checkouts. Preserve local commits and changes while refusing missing or diverged PR branches; instruct agents to push only the checked-out branch without rewriting published history.

Before switching an existing checkout to another PR branch, require its current HEAD to be contained in the freshly fetched same-name remote branch. Fail without switching or replacing workspace metadata when unpublished commits or missing push evidence would leave old work unprotected by cleanup. Resuming the same PR branch still preserves local unpublished commits.
