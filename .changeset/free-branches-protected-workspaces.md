---
'@nocobase/agent-runner': patch
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Allow agents to manage repository branches and task pull request associations while preserving every local branch, saved ref and uncommitted change. Reuse existing workspace state without switching branches and report completion without automatically pushing. Require fresh authorized remote evidence for all cleanup entry points, including settled tasks and forced GC, and persist explicit PR unlink choices against automatic relinking.

Upgrade Studio, its agents plugin and protocol, apply the PR link choice migration, and upgrade runners with `multiBranchWorkspaces`. Stop old daemons and scheduled cleanup and inventory existing directories before upgrading; never share a working root between old and new GC. Missing remote access conservatively retains directories rather than storing tokens or using host credentials for cleanup.
