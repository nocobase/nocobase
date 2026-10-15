# Reconciling finished issue decisions

Finished or cancelled issues settle obsolete merge requests, blocked questions and failed-run decisions automatically. Leaving review withdraws merge requests even if their original PR records are no longer linked. Unlinking a PR withdraws that PR's request on that issue. Existing merged, closed and other settled outcomes remain unchanged. Ordinary information, read state, other issues and independent subjects are preserved. A new review failure, owner handoff or personal runner request started after completion can still require a decision; reconciliation checks existing contributor records instead of cancelling work.

## Repair existing notifications

An administrator with the existing `pm.general/update` permission can preview one bounded page with `nb-studio inbox reconcile --json`. The operation is `POST /api/inbox/reconcile`, defaults to preview and accepts `execute`, `pageSize` (1–500, default 100), and `pageToken`. It accepts sign-in sessions and ordinary API keys; run tokens cannot invoke it. It never changes issue status, PR links, run state or request state.

The response lists issue identifiers, decision types, decision keys, recipient counts and proposed outcomes. It contains no message bodies or recipient identities. Each page covers whole decisions, including every recipient. `meta.scanned` counts decisions examined, including valid new decisions which are retained. Continue while `meta.nextPageToken` exists, even if a page contains no proposed repairs. Preview writes nothing and makes no GitHub requests.

After reviewing the preview, explicitly execute with `nb-studio inbox reconcile --execute --json`. Start execution without a page token, and continue execution with the returned `--page-token` until none remains. Execution re-reads the issue and contributor state before settling the page. A PR's own stored merged or closed result takes precedence; unknown historical PR identities are withdrawn. Settling uses the inbox service's conditional updates and publishes the existing realtime invalidation for affected recipients.

Inspect `meta.failed` on every executed page. Failed decisions are logged by key and remain eligible. Restart without a token to retry them; already settled decisions do not change or publish another invalidation. No timer or migration is installed. If automatic cleanup fails or a process stops during delivery, this same operation provides recovery.

For the incident recorded on PM-402, preview should include the ten obsolete merge decisions belonging to finished tasks. After authorized execution, verify `nb-studio inbox pending --json` and `nb-studio inbox waiting --json` for the affected person: those decisions should disappear and their decision count should reach zero, while the ordinary unread information count can remain one. Refresh events use the existing inbox subscriptions; no manual read or deletion is required. Deployment and execution against production data are separate operational steps.

## Runtime cost

Inbox reads, inbox polling, stable Git polling and runner claims add no queries, writes, locks or transactions. Merge-request delivery rechecks the issue and current PR links after sending; it settles only requests invalidated during delivery. Terminal issue events read unresolved decisions and their committed contributor state in batches. Reconciliation pages read candidate keys and all recipients together, then batch contributor lookups; execution repeats these checks and uses the existing per-decision conditional settlement. Writes grow only with obsolete decisions. Empty reruns do not write. No new lock or cross-service transaction is added.
