---
'@nocobase/hub-installer': minor
---

`upgrade --rebuild` builds the target again even when that version is already on disk, the running one included. It is for a machine whose Node major changed while the Hub was already on the latest version: the release's native modules no longer load, and until now `upgrade` answered that the Hub was already on that version and rebuilt nothing. The running version is built beside itself and swapped in during the same downtime an upgrade has; if the rebuilt release fails to start, the one it replaced is put back. `status` and the no-op `upgrade` now name the command when the Node major does not match.
