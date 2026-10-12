# Project manager fallback

The project manager settings expose `fallbackAfterSeconds` (default 120, integer 1–3600). Only runs whose agent id is `studio-project-manager` register an ordered model selection policy. Delegated agents continue using their existing selection rules.

Every queue episode persists `queueEnteredAt`; eligibility starts at `max(queueEnteredAt, availableAt)`. Merging input leaves the queue episode intact. Requeueing resets it, so delayed execution and retry backoff do not consume the delay. Existing queued rows are backfilled in bounded batches by `202610120002_ag_add_queue_entered_at`.

The runner's existing claim poll triggers selection. Before the threshold, a compatible first-choice runner reserves priority even when busy. After it, a fallback may claim using its request's actual free capacity. With no compatible first-choice runner, a fallback may claim immediately. Without an idle fallback, the original run remains queued and the first choice can still claim. A threshold can be followed by one polling interval of delay.

Selection rechecks the current queue episode under the existing agent lock and guarded queued-to-dispatched update. Assembly, admission, capacity, identity and policy checks still apply; assembly failure rolls back the claim and its selection history. The execution snapshot records the requested first choice, actual selected model, queue start, elapsed time and either `preferredQueued` or `preferredUnavailable`.

Protocol support alone does not establish project manager compatibility. `workspace.key`, used for its separate workspace, was implemented by nocobase-runner in commit `ddfe1b1874` and first ships in `0.1.0-beta.7`; beta.6 also speaks protocol 9. The centralized `supportsWorkspaceKey` boundary excludes earlier or unrecognized versions for payloads that require this field, while accepting older compatible releases. No new protocol version is required. Third-party or custom-version runners are conservatively excluded from these payloads until explicit capability negotiation is available.

The Now line reads the same assembled-payload compatibility checks as selection, distinguishing offline, incompatible, policy/identity restrictions, capacity, agent concurrency and same-thread work. Runner names are shown only to machine managers or their owners; capacity is sampled diagnostic data, while final claim admission uses the live transaction and the runner's request.
