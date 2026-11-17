# File upload transport

Multipart command bodies, attachment uploads and ticket Blob uploads use Node HTTP(S) with a backpressured pipeline. JSON requests retain fetch and the 120-second default. File requests default to 30 minutes; an explicit timeout still takes precedence. Caller cancellation is combined with the deadline. An injected fetch still receives the original FormData or Blob and the combined signal.

Local files are read in 64 KiB chunks through an explicitly owned file handle. The handle closes on success, cancellation, read failure, connection failure and an early server response. Node's file-backed Blob reader can defer closing a cancelled descriptor until garbage collection, so production file reads do not use that reader. Size and modification metadata are checked before and after reading. Multipart encoding preserves repeated fields, UTF-8 text, CRLF normalization, escaped disposition names and file media types, with a calculated content length.

File writes are sent once. Redirects are returned as HTTP errors rather than replaying the body or forwarding credentials. HTTP error bodies retain the CLI's existing error parsing. JSON request behavior and the manifest protocol are unchanged.

## Measurement method

Use Node.js 24.22.2 on Linux. Run a loopback HTTP receiver in a separate process from each client. Prepare sparse binary files of 64 MiB and 512 MiB outside the repository. Have the receiver consume data incrementally, pausing for 2 ms after each socket chunk. Count all received bytes and return a small JSON response. Construct the same file-backed File and multipart body for the original fetch sender and the native sender, and start a fresh client process for each measurement. Measure the client's peak RSS using `process.resourceUsage().maxRSS`, including the same source loader and CLI module imports in both clients. This measures process memory, not only JavaScript heap.

| File size | Original fetch peak RSS | Native HTTP peak RSS | Original / native duration |
| --------- | ----------------------- | -------------------- | -------------------------- |
| 64 MiB    | 186.5 MiB               | 137.9 MiB            | 2.27 / 2.22 seconds        |
| 512 MiB   | 669.4 MiB               | 157.3 MiB            | 18.02 / 18.17 seconds      |

Process RSS includes allocator and garbage collector headroom; the enforced read-ahead buffer is separate from that total. File size increased eightfold while the new sender's measured RSS grew by 19.4 MiB. No database queries, writes, locks, retries or additional business requests are introduced. Each local file adds one metadata lookup and two descriptor metadata checks.

For timeout verification, pause the receiver for 125 seconds before reading, then resume normal incremental consumption. For resource verification, repeat cancellation, socket disconnection and immediate HTTP 413 rejection ten times each with a 64 MiB local file. Count symlinks targeting the fixture in `/proc/self/fd` after each completed request, without forcing garbage collection. Each mode must finish with zero open fixture descriptors and exactly ten requests. Run the regular package tests to cover wire encoding, error parsing, explicit timeouts, pre-aborted calls, changed files, file read failure and injected fetch behavior.

These loopback checks exercise the client transport. Deployment proxy limits, browser device login and application deployment remain integration checks for the consuming application.
