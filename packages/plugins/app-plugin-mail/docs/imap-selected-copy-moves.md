# IMAP selected-copy moves

IMAP moves bind the business UUID, provider identity, source folder, source tuple/version and destination folder before a remote write. Only one selected source is moved. A same-folder request still verifies its source. Other providers retain their existing adapter calls and generic store commit path. No public adapter method, table or migration is added.

The adapter sends fixed UID MOVE or UID COPY commands and parses tagged and untagged COPYUID responses for the exact one-UID request. It never calls ImapFlow's implicit MOVE emulation, messageDelete or mailbox-wide EXPUNGE. COPY requires UIDPLUS, verifies the mapped destination and persists the mapping before setting the selected source's deletion flag. UIDPLUS is checked again after STORE; cleanup sends only UID EXPUNGE. A failed or uncertain native MOVE never falls back to COPY.

Source and destination protections use existing pending locations with matching 22-character base64url tokens. Their reason strings are 34 and 39 characters, within the existing 40-character bound. Ordinary sync cannot clear these markers, change their ownership or overwrite the protected message's content. Existing orphan cleanup preserves pending copies. Unrelated messages continue synchronizing. Confirmed destination ownership may be reused only for the same business UUID and without another move token; another UUID is never overwritten or merged.

The final transaction retires the selected source, confirms its exact destination, preserves the business UUID and local metadata, redirects only attachment locators belonging to that source and refreshes membership from all remaining valid/pending locations. Locator provider IDs and attachment API IDs may change; reload details and use the new links. Native/RFC provider IDs are retained only after remote verification. Scheduled drafts are checked at binding and commit, and pending moves also fence draft editing/scheduling and further remote flags/delete operations.

## Persistence cost

These are static SQL statement counts for one message, a new destination, one batch of relations and a non-scheduled result. They are a walk of the production persistence code, not measured latency. Common service authorization/account/message reads and the existing one-query folder lookup are excluded. Reloading the successful result adds five SELECTs (account, message, folders, labels and draft state). The account lock itself is an UPDATE and is included in the write count; BEGIN/COMMIT are excluded.

| Path                                                                            | SELECTs | Write statements, including account locks | Transactions / account locks |
| ------------------------------------------------------------------------------- | ------: | ----------------------------------------: | ---------------------------: |
| Fresh successful MOVE or COPY, binding and result reload included               |      21 |                                        11 |                        3 / 3 |
| Explicit completion of a persisted source/destination mapping, including reload |      17 |                                         8 |                        2 / 2 |
| Verified same-folder no-op, including reload                                    |      13 |                                         4 |                        2 / 2 |
| Remote response lost before a confirmed destination is persisted                |       6 |                                         2 |                        1 / 1 |
| Confirmed COPY followed by source cleanup failure                               |      10 |                                         4 |                        2 / 2 |

A fresh success consists of three binding reads, then source protection (three reads, two writes), destination protection (four reads, two writes), final commit/projection (six reads, seven writes), and five reload reads. Of its eleven writes, three acquire account locks; four update/create the selected source/destination states, two update the business message/provider identity/attachment metadata and projection, and two rebuild the UUID's membership from surviving locations. Relation insertion is one statement for the retained folder set, so written row count scales with that set. Attachment relocation scans existing metadata, without downloading attachment bytes or reading full MIME bodies.

Ordinary IMAP sync adds one account-scoped SELECT of protected location IDs/UUIDs per upsert step. Verification examines the marker in its existing row read; stale-membership cleanup adds a correlated protection predicate to its existing DELETE. These add no sync transaction or account lock. Pending locations continue preventing orphan deletion through the existing predicate. An IMAP flags/delete binding adds one protection SELECT; a draft edit/schedule/deletion with an IMAP identity adds one protection SELECT. Other provider operations do not acquire this extra protection query.

No database transaction spans a network await. SELECT/FETCH, transfer commands, target confirmation, STORE, UID EXPUNGE and source disappearance checks run between completed local transactions. Source/destination markers remain durable during those waits. A lost response without a trustworthy mapping retains the UUID and its source marker and requires authorized remote verification; this release intentionally adds no automatic reconciliation, protection-release API or blind retry system.

## Validation boundaries

Deterministic protocol fixtures and real migrated databases cover exact source selection, UID mappings, capability loss, response loss, explicit partial-copy recovery, sync/orphan protection, long locators, attachment link relocation and scheduled boundaries. HTTP/SDK/OpenAPI tests cover optional source fields and localized failures. Workspace tests and an isolated running application cover aggregate-source and missing-Trash explanations and Inbox-versus-Trash deletion semantics.

Local protocol fixtures and local application screenshots do not establish Gmail IMAP, Tencent Enterprise, Alibaba Enterprise, QQ or 163 interoperability. Those providers require authorized dedicated test messages and safe move/restore evidence. Provider-side object/label effects may alter other positions; this implementation does not promise that a remote server leaves them unchanged.
