---
"@nocobase/app-plugin-mail": patch
---

Import new IMAP messages promptly during mailbox verification and between synchronization runs.

Screen historical copies without downloading out-of-range bodies, yield slow imports for new arrivals, and resume history-complete partial synchronization safely.

Commit bounded top history pages and new folder copies earlier, with redacted notification-to-commit timing for diagnosing slow delivery.
