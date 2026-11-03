---
"@nocobase/agent-runner": patch
---

Follow a task workspace's Git configuration instead of refusing settings outside a fixed list. Reused workspaces failed with `checkoutFailed` ("unsafe or unsupported Git configuration") once an agent's submodule setup wrote fetch settings such as `remote.origin.tagOpt`, `promisor` or `partialCloneFilter`. The runner's own Git calls keep overriding hooks, fsmonitor, credential helpers, the remote URL and allowed protocols, and redirected metadata — a Git directory, submodule pointer or `core.worktree` leading outside the checkout — is still refused.
