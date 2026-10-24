---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-template-examples': patch
---

Unify native realtime and background conversations on complete internal SDK UI messages, deriving safe public UI history and private model replay from the same original. Restore the common `OnlineAgent` interface with `RealtimeOnlineAgent` and `BackgroundOnlineAgent` subinterfaces and concrete session implementations. Background agents expose `run`, `get`, and `try` without `send` or browser-stream dependencies; structured results remain independently validated execution data. Update application consumers to use the background interface. Historical background ModelMessage storage is not supported by the new reader.
