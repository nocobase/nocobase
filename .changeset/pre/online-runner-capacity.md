---
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": minor
"@nocobase/app-plugin-agents": patch
---

Apply each application's online runner slots and tool limits from heartbeat replies without restarting. Count tasks and build jobs independently per application, wake capacity waits after changes, and keep existing leases during shrinkage. New registrations default to four slots and online registration settings take precedence over legacy client hints.

Remove local slot configuration flags from register and start. Retain existing local values only for older servers until all connected applications support online capacity. The runner status JSON now reports effective capacity and its source under each apps entry instead of top-level slots and toolSlots. Runtime pages show reported capacity, pending synchronization, legacy compatibility and the last offline report.
