---
'@nocobase/app-plugin-agents': patch
---

Continue queued Runner conversation messages in the next turn after a user stops the current turn, keeping the original messages and excluding received or withdrawn inputs.

Preserve saved input revisions across stream recovery without allowing older assistant snapshots to overwrite replayed output.
