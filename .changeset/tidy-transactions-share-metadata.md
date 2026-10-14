---
'@nocobase/db': patch
---

Reuse validated Collection naming metadata across database transactions after checking a transactional version marker, avoiding repeated full metadata reads while preserving transaction-local physical schema inspection, savepoint isolation, and cache invalidation.
