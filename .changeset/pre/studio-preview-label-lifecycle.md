---
'@nocobase/studio': patch
---

Refresh the lifecycle of pull requests with Studio-managed preview labels after their last issue is unlinked. Closed or merged pull requests stop being polled and their labels remain untouched, while failed label removals on open pull requests continue to retry.
