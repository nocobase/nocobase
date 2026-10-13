---
'@nocobase/app-plugin-agent-sessions': patch
---

Reduce the mobile session header and reply box, keep linked task counts and actual statuses visible, and fit replies to the keyboard viewport. Defer header folding until its height change can be compensated without moving the message being read, including at scroll boundaries. Preserve the compensated reading position when the header resize reaches the automatic bottom-follow observer.
