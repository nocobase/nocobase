---
"@nocobase/studio": patch
---

Capture the `?comment=` target locally and remove it from the issue page's address immediately, replacing the current history entry so it cannot leak across navigation or refreshes. Keep locating the comment after highlight cancellation, remove `comment` from plan links and their return paths while preserving other query parameters, and keep the highlight's timed fade and click cancellation.
