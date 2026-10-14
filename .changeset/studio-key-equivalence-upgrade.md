---
'@nocobase/studio': patch
---

Provide an offline, hash-checked equivalence path for existing API keys during the Studio access upgrade. Preserve key identities and scopes, convert only proved equivalent private role grants, and retain conflict-checked recovery records. Keys with changed account target ranges or unproved delegation continue to stop with specific differences.
