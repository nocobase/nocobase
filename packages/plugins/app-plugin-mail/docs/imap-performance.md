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

Attachment tests consume real Node streams through the adapter: two sequential downloads create one connection, and two overlapping downloads use distinct connections. Pool tests cover idle expiry, account/configuration/credential isolation, failed handshakes, unusable connections and shutdown. No attachment cache, batch-download API, background prefetch or automatic reconnect retry is introduced. Live Gmail timing remains an external validation step.
