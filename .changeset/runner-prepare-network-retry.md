---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
---

Retry a run's preparation when git fails for a passing cause. The runner retries cloning, fetching and the submodules' update three times, after 2, 5 and 15 seconds, when git's error names a cut-off TLS handshake, a reset, refused or timed-out connection, a name that did not resolve, or an HTTP 5xx or 429, and aborts a transfer slower than 1 KiB/s for a minute instead of hanging. Each retry is a `status` event in the run. A repository that does not exist, credentials the host refuses, a certificate the runner does not trust, any other HTTP 4xx, and an error that names no passing cause fail at once, with a hint of what to fix where git names the cause. When every retry fails, the run fails with the new retryable reason `prepareNetwork`, and the application queues it again under the run's retry policy. The failure's error event records how many retries were made and the last error, also when the last attempt failed for a permanent cause. Submodules an earlier preparation could not finish, nested ones included, are finished by the next preparation of the same worktree. The application announces the reasons it accepts on each run (`RunHeader.acceptedFailures`), and the runner reports `checkoutFailed` to an application that does not announce `prepareNetwork`.
