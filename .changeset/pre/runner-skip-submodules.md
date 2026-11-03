---
'@nocobase/agent-runner': patch
---

The runner no longer initializes a repository's submodules while preparing a checkout, so a new checkout no longer downloads every submodule in full. A prepared checkout leaves its submodules uninitialized; a project whose repository has submodules should tell its agents how to initialize them, for example `git submodule update --init --reference <local copy>` or a shallow `--depth 1` update. Submodules an agent initialized are still checked for unpushed commits before a checkout is removed.
