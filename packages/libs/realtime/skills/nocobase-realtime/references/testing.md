# Verification

Exercise behavior through the owning service, authorized HTTP endpoint and real client where practical. Application tests use `@nocobase/app-testing` fixtures; avoid replacing the refresh scheduler with a mock when testing concurrency or recovery.

- Open two authorized views. Commit a mutation in one and observe the other without a manual reload. Verify another user cannot subscribe to protected data or fetch it through HTTP.
- Hold a pre-event HTTP request open, emit a change, then resolve the old response. Expect a subsequent read and the new state, including first load, query prefixes and inactive-to-active queries.
- Keep a slow read open while repeated events arrive. Expect visible progress and one trailing read, not perpetual cancellation or parallel requests.
- Fail a read transiently and stop sending events. Expect automatic retry, bounded exhaustion and working manual Retry. A 401/403 stops automatic retries and removes protected stale content.
- Disconnect or pause the client, mutate persisted state, reconnect and await topic acknowledgement. Expect an authoritative catch-up read. Repeat with Redis subscription loss while the browser socket remains open.
- Revoke a resource/session during an in-flight read or authorization. Expect no resurrected subscription or late protected snapshot. A denied topic must not block another allowed topic.
- Complete an empty job, fail it, retry it and cancel it. Each committed visible state needs an announcement; a notification failure must not roll back an already committed operation.
- Hide/unmount the view or change its resource/account. Check timers, watches, abort handling and stale responses. Retained time-based/external-state polling is tested independently of notifications.
- At the server boundary, hold one topic's authorization, fill its queue and publish another topic. Check isolation, limits, cancellation and diagnostics. `delivery: 'latest'` may merge replaceable snapshots, while default delivery preserves all admitted ordered events.
- With an isolated Redis instance, verify zero-local-subscriber publication, namespace isolation, duplicate IDs, remote user/session revocation, broker outage and acknowledged recovery. Publish results do not prove browser delivery.

Run scoped lint/typecheck/tests/build for the changed packages and affected consumers. Validate published `skills/` files and synchronize them into the target application; do not edit generated `.agents/skills/` copies. Report browser, topology or load scenarios that were not actually exercised instead of turning functional tests into a throughput claim.
