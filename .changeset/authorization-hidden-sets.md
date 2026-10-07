---
'@nocobase/authorization': minor
---

A Permission Set protection may be `hidden`: the set is its owner's implementation detail (the grants of one API key's identity, say), and `protection(key)` reports it so a generic management surface can leave the set out of its lists. Holding the set allows exactly what it did.
