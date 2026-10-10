---
'@nocobase/app-plugin-dag-flow': minor
---

Store run and node-run timestamps as instants, so durations stop reporting a whole time-zone offset

Every timestamp on a run and a node run was declared `datetime`, the zone-free type, while the engine wrote UTC instants through `database.query()` — the query builder, which is deliberately not Collection metadata aware and hands values straight to the driver. On PostgreSQL the offset was dropped on the way in and a `Date` was rebuilt in the host's zone on the way out, so a value moved by the host offset on every round trip; on MySQL the write was rejected outright.

`startedAt` was written, read back, and written again when the node finished, while `finishedAt` was written fresh, so the pair ended up a full host offset apart and a node that ran for three milliseconds reported about 28800 seconds.

The columns are now `datetimeTz`, and the engine persists through Repositories instead of the query builder. That is the layer that reads Collection metadata, so it already knows what `datetimeTz` costs on each database and formats these columns at the SQL boundary — no driver decodes a timestamp in either direction. A run's instants are consequently written and read as canonical `YYYY-MM-DDTHH:mm:ss.sssZ` strings on every dialect, with no dialect branch in the plugin and no connection option a deployment has to set.

A migration converts the columns, reading the existing zone-free values as the UTC they were written as. It cannot repair history: on an affected PostgreSQL deployment a node run's stored `startedAt` already carries an extra offset that nothing recorded, so runs from before the upgrade keep their reported duration. Runs created afterwards are correct.

Two fixes came with the move. A node run is now read back from the insert that wrote it rather than by re-selecting the newest row for that node, which two processes running the same execution could get wrong. And the per-workflow and per-revision execution counters are upserts with a database-side increment rather than a read followed by a write, so concurrent triggers of one workflow can no longer lose a count.
