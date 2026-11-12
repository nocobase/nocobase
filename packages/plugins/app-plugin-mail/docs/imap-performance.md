# IMAP verification and connection reuse

Verification reads known copies in batches of up to 1000 UIDs while each folder is selected. Each batch requests flags and only the identity metadata needed by its stored copies. A disappearing UID or conflicting identity makes the pass unstable; existing bounded verification retries reconcile it or leave the run partial. Folder traversal, batches and known-copy reconciliation check the step's abort signal.

The application owns an IMAP pool. Each adapter borrows a connection exclusively until close, including the attachment stream's lifetime. A SHA-256 key covers the account, endpoint, TLS verification setting and credentials. One usable idle connection per account is retained for 60 seconds; concurrent operations open separate connections and surplus returns close. Failed operations destroy their connection, and application shutdown closes the pool. No database reads, writes, transactions or database locks are added by pooling or batch verification. Each borrow computes one hash and performs in-memory lookups. Attachment requests and synchronization step counts remain unchanged; there is no polling or per-tab request change.

## Reproducing the protocol measurement

Run the previous and current `ImapSmtpAdapter.verifyFolders` against the same deterministic in-memory IMAP fixture: six folders, 47 valid OBJECTID copies per folder, unchanged UIDVALIDITY and UIDNEXT, and two consecutive verification passes. Implement LIST, SELECT, SEARCH, FETCH-one and FETCH-all with counters and a controlled one-millisecond delay per command. Return the same UID, flags and native identity from both FETCH implementations. Keep the benchmark driver outside the repository; use the committed integration tests to enforce protocol bounds.

| Two passes, 282 copies          | Previous | Batched |
| ------------------------------- | -------: | ------: |
| Mailbox opens                   |      588 |      24 |
| Single-copy FETCH               |      564 |       0 |
| Batch FETCH                     |        0 |      12 |
| SEARCH                          |       24 |      24 |
| LIST                            |        4 |       4 |
| Total commands                  |     1180 |      64 |
| Controlled-fixture elapsed time |  1292 ms |   82 ms |

These timings measure the controlled fixture, not Gmail latency. The regression test repeats with one and 47 copies per folder and requires 12 batch FETCH commands, zero per-copy flag reads and 24 mailbox opens in both cases; it also checks the persisted read flags. No attachment content is downloaded by verification.

Attachment tests consume real Node streams through the adapter: two sequential downloads create one connection, and two overlapping downloads use distinct connections. Pool tests cover idle expiry, account/configuration/credential isolation, failed handshakes, unusable connections and shutdown. Pooling introduces no attachment cache, batch-download API, background prefetch or automatic reconnect retry. Live Gmail timing remains an external validation step.

## New arrivals during verification

Verification now checks UIDNEXT between folders and batches, including the final SEARCH traversal, when at least four seconds have elapsed since its last check. LIST-STATUS servers use one additional LIST; other servers use one STATUS of INBOX. Existing SELECT and final LIST responses also interrupt verification when they reveal new UIDs. The next step imports the messages before verification continues. A saved complete pass remains usable for UIDs below its old UIDNEXT; UIDVALIDITY changes, expunged old UIDs and newly imported copies that disappear still prevent premature cleanup. Interrupted passes retain the existing attempt limit and finish partial when it is exhausted.

The check interval is not a protocol command deadline: a slow SELECT, SEARCH, FETCH or network round trip can delay the next check. Real Gmail acceptance must measure arrival to `MailService.listMessages`, particularly for a large All Mail folder. Without LIST-STATUS, only INBOX gets the intermediate STATUS check; other folders retain the existing traversal and final LIST checks.

For a before/after protocol measurement, run the pre-change and current adapters' two verification passes with six folders, 47 bound OBJECTID copies per folder and unchanged mailbox state. Advance a controlled clock by 3500 ms per batch FETCH, keeping the fixture and all other command responses identical. This models 21 seconds per pass without real sleeps. The temporary measurement driver stays outside the repository.

| Two passes, 282 copies | Before | After |
| ---------------------- | -----: | ----: |
| LIST                   |      4 |     8 |
| SELECT                 |     24 |    24 |
| SEARCH                 |     24 |    24 |
| Batch FETCH            |     12 |    12 |
| Total commands         |     64 |    68 |

The controlled workload adds four commands (6.25%). The maximum rate is one extra check per four seconds during verification, with about ten extra commands across two 21-second passes when command boundaries permit that cadence. Integration tests bound a complete quiet incremental run to seven LIST calls with instantaneous commands and eleven with the controlled 3500 ms batches; the extra three calls include run preparation and each step's initial folder listing. Verification still adds no database queries, writes, transactions or locks and no per-tab or HTTP polling requests.

## INBOX IDLE

Each active IMAP account has one dedicated INBOX IDLE connection per application instance, separate from the borrowed operation connections. Startup and the existing account sweep reconcile listeners using the already loaded accounts. Local account creation, reauthorization, suspension and removal update the listener immediately; changes made by another instance are observed on the next existing sweep. An increased INBOX EXISTS count calls the existing `schedulePushSync` path, which either starts a run or leaves a durable pending push for the active run. Connecting also requests one catch-up sync so messages received while disconnected are not missed.

ImapFlow renews IDLE every 25 minutes. The dedicated socket timeout is 26 minutes to avoid the ordinary connection's one-minute keepalive NOOP. Failures retry after 1, 2, 4 seconds and up to 60 seconds, resetting after a successful INBOX selection. Servers without IDLE close the dedicated connection and keep ordinary automatic synchronization; they do not gain a NOOP polling loop. Account removal, suspension, credential replacement and application shutdown close the connection and cancel retries.

Quiet IDLE connections add no periodic database work or sync runs. Opening or reconnecting reads the credential vault once and invokes one existing push scheduling operation; each increased EXISTS invokes that same scheduling operation. Account mutation adds only an in-memory notification and, when starting a listener, its asynchronous credential read. There are no new tables, migrations, database locks or transactions. No connection deduplication across instances or IDLE monitoring outside INBOX is included. Legacy cursor migration and special recovery for repeated verification interruption remain follow-ups.
