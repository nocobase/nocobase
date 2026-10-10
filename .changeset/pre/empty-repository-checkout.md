---
"@nocobase/studio": patch
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
---

Allow applications to opt coding runs into verified empty-repository initialization. Prepare the default branch without a seed commit, report the first-delivery instructions, and guard its push against updating an existing remote branch. Keep missing branches in populated repositories as checkout failures.
