# Knowledge base database

The immutable creation migration, `202610030010_kb_create_tables`, creates the original nine business tables. Every table is prefixed `kb`:

- `kbSpaces`: one tree of documents per space, named by the application's kind (`scope`) and key (`scopeId`), made with its first document.
- `kbDocs`: an entry at its current version: its kind (`folder`, `article`, `file`), tree position, slug (unique in its space), title, summary, version (0 for a folder), verification and archiving, its access mode (`inherit` or `custom`) and its access key (`aclKey`, `docs/permissions.md`).
- `kbDocAccess`: an entry's own permission entries, one level per subject of an application-declared type.
- `kbDocVersions`: every version of an article or a file whole, with its author, its source, the run, the proposal it applied and who approved it; a file's names its stored file, holds its extracted text and where the extraction stands (`parseStatus`, `parseError`).
- `kbChunks`: the current version cut at its h1–h3 headings (an article's content, a file's extracted text), rewritten with each version and once a file's text is extracted, with the entry's access key; what search reads and its hits cite.
- `kbFiles`: the stored files, the file plugin's columns with the uploader and the SHA-256 of the bytes.
- `kbProposals`: changes an actor or a person who may only propose suggests: `update`, `create` or `verify`, with the version they were written against, and the file proposed, if any.
- `kbUploadTickets`: one-time uploads of a file to propose, with who proposes and what, and the hash of the secret that redeems each.
- `kbSnapshots`: what a snapshot exported, document by document, under the application's key (a run's id) and series (a session).

## Index control tables

The separate, self-contained `202610210010_kb_create_indexing` migration adds five control tables without changing the original nine or contacting vector storage:

- `kbIndexingSettings`: the global singleton, canonical revision, application namespace, source sequence and active/building pointers. The initial configuration is null; upgrading does not invoke a model or rebuild existing documents.
- `kbIndexGenerations`: immutable generation identity/configuration snapshots, scan cursor, publication and cleanup state, and sanitized diagnostics. Connections and credentials never enter these snapshots.
- `kbIndexSources`: the latest source revision and tombstone per document, shared across generations. Source facts and current-generation work are journaled in the same transaction as the document/chunk changes.
- `kbIndexWork`: per-generation/document wanted and applied watermarks, business progress and dispatch hints. This is durable business intent, not a second job queue, retry budget or worker lease. Deleting acknowledged dropped-generation metadata cascades to its work rows.
- `kbIndexRequests`: principal-scoped idempotency receipts for management operations, retained for seven days before bounded cleanup.

External vector documents, entries and permanent closed-owner markers belong to the selected backend, not these business tables or Agents. Dropping a generation never deletes source tombstones or business documents. Migration down removes only these five new tables in dependency order and does not claim to delete external targets; run it only in a stopped, closed-index maintenance window. See [indexing operations](../docs/indexing.md).

The application's records (projects, runs, issues) are named by id only, never by foreign key. After the plugin's first release, schema changes are new migrations; the creation migration is not edited.
