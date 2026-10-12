# Knowledge base database

The creation migration, `202610030010_kb_create_tables`, holds the schema, and `202610240040_kb_proposals_add_revisions` adds revisions and database coordination per target and source. Every table is prefixed `kb`:

- `kbSpaces`: one tree of documents per space, named by the application's kind (`scope`) and key (`scopeId`), made with its first document.
- `kbDocs`: an entry at its current version: its kind (`folder`, `article`, `file`), tree position, slug (unique in its space), title, summary, version (0 for a folder), verification and archiving, its access mode (`inherit` or `custom`) and its access key (`aclKey`, `docs/permissions.md`).
- `kbDocAccess`: an entry's own permission entries, one level per subject of an application-declared type.
- `kbDocVersions`: every version of an article or a file whole, with its author, its source, the run, the proposal it applied and who approved it; a file's names its stored file, holds its extracted text and where the extraction stands (`parseStatus`, `parseError`).
- `kbChunks`: the current version cut at its h1–h3 headings (an article's content, a file's extracted text), rewritten with each version and once a file's text is extracted, with the entry's access key; what search reads and its hits cite.
- `kbFiles`: the stored files, the file plugin's columns with the uploader and the SHA-256 of the bytes.
- `kbProposals`: changes an actor or a person who may only propose suggests: `update`, `create` or `verify`, with the version they were written against and their file; `replacesId` names the proposal sent back, and `origin` `document` stands for a document revision. `groupKey` is the stable target/source identity, including after a create is accepted. `openKey`, unique, is the group key for its active item and its own id otherwise. Historical duplicates retain their status and audit data; `legacyDuplicate` prevents their creates from generating a renamed second document after the target exists.
- `kbProposalGroups`: one activity slot per target/source, with `activeProposalId` and a `lockToken` updated as the first business write in every group transaction. Historical waiting items may only be rejected or withdrawn. Closing the active item hands the slot to the oldest remaining item by createdAt/id without emitting a change request; a legal revision retains priority. Empty groups remain to coordinate future requests.
- `kbUploadTickets`: one-time uploads of a file to propose, with who proposes and what, and the hash of the secret that redeems each.
- `kbSnapshots`: what a snapshot exported, document by document, under the application's key (a run's id) and series (a session).

The application's records (projects, runs, issues) are named by id only, never by foreign key. After the plugin's first release, schema changes are new migrations; the creation migration is not edited.

This revision changes an unmerged migration. Disposable preview databases that already executed its older definition must be rebuilt using the current branch; changing the source or repairing a checksum does not create the new columns and coordination table. Shared previews and production databases require a separately approved rebuild or explicit forward migration, and must not be cleared by a development runner.
