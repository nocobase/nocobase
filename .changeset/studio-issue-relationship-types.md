---
'@nocobase/studio': patch
'@nocobase/app-plugin-projects': patch
---

Let issue details add "Related" links as well as prerequisites, and let editors change an existing relationship's type, so linking related work no longer holds the issue.

Convert relationship types atomically on the server, preserving the link ID and rejecting stale changes or an existing target relationship without deleting either link.

Protect dependency graph additions with a shared database revision so concurrent conversions, new dependencies, hierarchy changes and restores cannot commit a cycle, including transactions with an older MySQL snapshot.
