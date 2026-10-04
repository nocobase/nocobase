# Delivery Diagnostics

## Evidence order

1. Resolve the exact Notification id from the send result, business source, or logs page.
2. Read the Notification summary and all Deliveries.
3. For each unexpected Delivery, record Channel, Provider identifier, status, attempt count, `nextRunAt`, and sanitized `lastError`.
4. Read Retry Audits and Attempts in order. A Retry Audit exists for every accepted manual retry request; an Attempt exists only after Provider submission starts. Identify whether failure happened before Provider submission, during a known failed submission, or after an uncertain submission.
5. Correlate structured server logs by Notification id, Delivery id, Attempt id, Channel, and Provider identity.
6. Inspect effective redacted configuration and runtime registration only after fixing the failing layer in the evidence chain.

The protected logs API intentionally omits message and recipient snapshots plus lease tokens. Use server-side business context for content diagnosis; do not weaken redaction or query raw tables merely to display secrets.

## Status-specific checks

### Pending or processing

- Confirm the application composes `JobExecutorServiceProvider` and that the `jobs` configuration Deliveries run on — `notification.jobs`, otherwise `jobs.default` — is the one every instance shares; on the built-in memory configuration each process consumes only its own Deliveries.
- Look for `notification.delivery.enqueue_failed`; the reconciler should redispatch ready work.
- Confirm the reconciler interval and ready batch are advancing.
- For `retrying`, the Delivery is scheduled for retry and `nextRunAt` records its earliest execution time.
- For a long `preparing`/`submitting` state, inspect lease heartbeat, worker health, Provider timeout, and application shutdown.

An expired preparation lease returns to pending. An expired submission lease becomes unknown because the worker may have completed the external request before losing persistence.

### Failed

- `recipient`: the Channel rejects the recipient, the recipient is required but missing, or the address is invalid.
- `configuration`: definition, Provider identity, sender, or runtime configuration is missing/invalid.
- `authentication`: Provider credentials were rejected.
- `content`: rendered/prepared message violates Provider constraints.
- `network`, `rate_limit`, or `timeout`: inspect the Provider result, attempt count, and `nextRunAt`.
- `storage`: persistence or in-app inbox delivery failed.
- `provider` or `unknown`: inspect the Provider's sanitized response and correlated logs.

A Provider can request same-Provider retry. Once the configured attempt limit is exhausted, the Delivery becomes terminal failed. The runtime does not fail over to another Provider.

### Partial

Treat every Delivery independently. Identify exactly which recipient/Channel/Provider combinations were accepted and which failed. A new send for only failed combinations is a new Notification and requires duplicate-risk review.

### Unknown

Do not retry an unknown Delivery directly. Use Provider message id when available, external Provider dashboards, target inbox/group evidence, and timestamps to determine whether submission happened. If proof remains unavailable, report an indeterminate external effect. If evidence confirms that no message was submitted, create a new logical Notification with the original business idempotency policy.

## Common symptoms

| Symptom                               | Check                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Channel is not enabled                | Effective `notification.channels`, `enabled`, and exact type                                                                       |
| Channel definition is not registered  | Optional plugin installed/enabled and boot order before first send                                                                 |
| Provider definition is not registered | Built-in/custom Provider plugin booted and exact Provider identifier                                                               |
| No matching enabled Provider          | Channel name and effective enabled configuration                                                                                   |
| Runtime identity mismatch             | Definition returns the registered Provider identifier exactly                                                                      |
| Unsupported recipient                 | Native recipient address and message validation contract                                                                           |
| Delivery submission warning           | Reconciler recovery, jobs executor availability, persistent ready Delivery                                                         |
| Repeated retry                        | Attempt categories, configured retry interval, and maximum attempts                                                                |
| Submission timeout                    | Provider timeout, abort handling, remote latency, and unknown risk                                                                 |
| Log route 401/403                     | Authentication, then reason `NOTIFICATION_LOGS_FORBIDDEN`: `page:notification.logs` `access` permission                            |
| Notification test 403                 | Reason `NOTIFICATION_TEST_HEADER_REQUIRED`: the test header; `NOTIFICATION_TEST_FORBIDDEN`: `notification:test/send` on submission |

## Safe recovery

- Correct configuration or restore a missing definition, restart through the normal lifecycle, and allow reconciliation to process pending/retryable Deliveries.
- Do not rewrite Provider identifier on persisted Deliveries.
- Do not mark a failed or unknown Delivery accepted by hand.
- After correcting the cause, retry a terminal failed Delivery with `retryDelivery({ deliveryId, reason })`; a Delivery in `retrying` is already scheduled. An unsupported recipient cannot be repaired in-place and requires a corrected new logical send.
- For unknown, inspect Provider evidence first. If the evidence confirms that no message was submitted, create a new logical Notification; if the result remains uncertain, keep the Delivery as `unknown` and report the external effect as indeterminate.
- Preserve all prior history and document possible duplicates for any recovery after an unknown submission.

## Diagnostic report

Report Notification id/status, each relevant Delivery id/status, Channel, Provider identifier, Retry Audit reason/evidence, Attempt sequence/status/timestamps, sanitized error category/code/message, `nextRunAt`, queue/reconciler evidence, and the safest recovery. State explicitly whether final downstream delivery is proven, merely Provider-accepted, failed, or unknown.
