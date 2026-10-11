# Knowledge base

Studio's knowledge base is one source for two kinds of reader: people and agents doing work (Runner) read it as files beside their working directories, and online agents (Online) search and read it through the `kb` commands, citing the section they used.

The knowledge base itself is the open-source knowledge plugin, `@nocobase/app-plugin-knowledge` (`packages/plugins/app-plugin-knowledge`, its README lists its API): spaces of folders, articles and files, versions, the text extracted from files, sections and search, proposals and their review, snapshots exported as files, the `/api/knowledge` endpoints and the knowledge view. It knows nothing of projects or agents. Studio assembles it (`server/knowledge`, `client/knowledge`, `shared/knowledge.ts`):

| Studio keeps                                                         | Where                                                                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Its spaces and who may do what in each (the access resolver)         | `server/knowledge/access.ts`, `directory.ts`, bound to `knowledgeAccessToken`                         |
| The `nb-studio kb` views (`/api/kb`), wrapping the plugin's services | `server/knowledge/views.ts`, `routes.ts`, `actions.ts`                                                |
| The brief's knowledge sections and the runner mount of snapshots     | `server/knowledge/brief.ts`, `mount.ts`                                                               |
| What a conversation reads                                            | `server/knowledge/conversation.ts`                                                                    |
| The retrospective rule and the user manual's rules                   | `server/knowledge/retrospective.ts`, `brief.ts`                                                       |
| The inbox cards of proposals                                         | `server/knowledge/inbox.ts`, `client/inbox/contributions/knowledge.ts`                                |
| Vector search, reranking and contextual retrieval                    | `server/knowledge/vectors.ts`                                                                         |
| The default chunking and ranking the plugin reads                    | `server/knowledge/tuning.ts`                                                                          |
| The knowledge search settings (Settings › Knowledge search)          | `server/knowledge/search-settings.ts`, `search-routes.ts`, `client/pages/config/knowledge-search.tsx` |
| The system knowledge page and a project's Knowledge tab              | `client/pages/knowledge`, `client/pages/projects/detail/knowledge.tsx`                                |
| The space switcher and the space access sheet's roles                | `client/knowledge/space-switcher.tsx`, `client/knowledge/access.ts`                                   |

Studio words its spaces in the plugin's view (`client/knowledge/labels.ts`) and refreshes its inbox after a decision there; the view itself is the plugin's.

## Model

The plugin's tables (its migration `202610030010_kb_create_tables`):

| Table             | What it holds                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kbSpaces`        | One tree of entries: in Studio the system's (`system`, scope id empty) or a project's (`project`, its id), made with its first one                             |
| `kbDocs`          | An entry at its current version: `folder`, `article` or `file`, tree position, slug (unique in its space), title, summary, version, `verifiedAt`, `archivedAt` |
| `kbDocVersions`   | Every version whole, with its author, the source (`{ kind, id }`: an issue), the run, the proposal and who approved it; a file's, its file and extracted text  |
| `kbChunks`        | The current version cut at its h1–h3 headings (an article's text, a file's extracted text); what search reads and its hits cite                                |
| `kbFiles`         | The stored files (the file plugin's columns on a Drive disk), with the uploader and the hash of the bytes                                                      |
| `kbProposals`     | Changes agents (or people who may only propose) suggest: `update`, `create` or `verify`, with the version they were written against, and a file, if any        |
| `kbUploadTickets` | One-time uploads of a file an agent proposes (`nb-studio kb upload`)                                                                                           |
| `kbSnapshots`     | What each run was given as files: every entry's version and path, under the run's id, in the series of its session                                             |

- The plugin names no spaces: Studio's access resolver has the system's and one per project, and a project's space inherits the system's. Inheriting only adds: a project document never hides a system one of the same slug, both are listed, and each space keeps its own permissions.
- A save writes a whole new version against the version the editor read (`expectedVersion`; 409 `KNOWLEDGE_VERSION_CONFLICT` otherwise). Saving what is there writes nothing. Moving, archiving and marking verified write no version.
- The tree nests four levels; a document with live children is not archived. A folder has a name and a place only; nothing goes under a file.
- A file keeps its original bytes (served only through the plugin's routes, after its access check) and its text extracted as Markdown in a worker thread once uploaded (PDF, Word, Excel, PowerPoint, CSV, text, Markdown, JSON; no OCR; anything else is stored only). The extracted text is what search, the runner mount and `kb read` give; `kb download` gives the original.

## Who may do what

The knowledge plugin declares four business actions, `kb.knowledge/read`, `propose`, `edit` and `manage`, and the page `knowledge` (its `shared/access.ts`), and registers the actions with the authorization plugin as the `kb` resource type, each level its own action (`read.related`, `read.all`); Studio's role editor offers them from the catalog like the other plugins' own (`server/access/catalog.ts`), and the plugin never decides on its own: it asks Studio's access resolver (`server/knowledge/access.ts`) what a reader may do in each space. "Related" is Studio's: the projects one sees for reading and proposing, and the projects one leads for editing and managing (`KNOWLEDGE_RELATIONS`); levels resolve to user sets through Studio's scope levels like every plugin's. The system's documents need `edit` (and `manage`) at all. The built-in contributor reads and proposes in the projects they see and edits and manages in those they lead; administrators and owners do everything and open the system knowledge page (`/knowledge`, page grant `knowledge`).

Below a space, each folder, article and file may narrow or widen that access: it inherits its parent's (the space's at the top) plus entries of its own, or, in custom mode, only its own entries, at the levels read, propose, edit and manage, granted to Studio's subjects: a user, a role, the space's project members or lead, or an agent. Whoever manages the space (`kb.knowledge/manage`: a project's lead in its space, the administrators everywhere) keeps managing every node in it, and retrieval filters by each section's access key inside every query, vector search included. The design is the plugin's `docs/permissions.md` (`packages/plugins/app-plugin-knowledge/docs/permissions.md`); Studio's subject providers are in `server/knowledge/subjects.ts`.

An agent reads and proposes, never edits (the plugin holds to that whatever the resolver answers): its run holds at most `kb.knowledge/read` and `propose` (annotated in `server/access/action-policy.ts`, both ticked for a new agent), within what the person who woke it holds. The decision card of a proposal goes to the project's lead, or to the administrators for the system space or a project without a lead who may edit.

## Proposals

- One pending proposal per source (the issue a run works on, or else the proposer) and document; at most three per run; content a decider rejected from the same source is refused again.
- A proposal whose document moved past its base version is stale: accepting answers 409 `KNOWLEDGE_PROPOSAL_STALE` unless confirmed, and then its content becomes the next version whole (no merge). The decider sees the change against the base version and, when stale, against the current one.
- `verify` changes nothing but `verifiedAt`: "I checked this page, it still holds".
- Every proposal, from an issue or not, puts a decision card in its deciders' inboxes (source `knowledge`); deciding settles every card and tells the person it was made for.

## Work: what a run is told and given

Through two generic extension points of the agents plugin, which know nothing of knowledge:

- **Brief section** (`agents.briefs.sections`): the run's project and system top-level documents with their summaries, where the full text is, and the user manual rule below. How to propose (at most three) and what is worth proposing are told only in a retrospective run, below: earlier runs have not verified their conclusions yet. Only for an agent configured to read knowledge, for a person who may. It sits in the brief's context layer, outside the session fingerprint.
- **Mount** (`agents.mounts`, protocol 5 `RunPayload.mounts`, the runner's `mountsStep`): a snapshot (the plugin's `snapshots`, worded by Studio's `RUN_LAYOUT`) taken at claim of the documents the person who woke the agent reads, placed in `<workDir>/.nocobase-runner/knowledge/` as `INDEX.md`, `.manifest.json`, `project/…` and `system/…`, each file with front matter naming its document and version; folders are directories, and a file is its extracted text (`report.pdf.md`), never its original, which `INDEX.md` says `nb-studio kb download` saves. The runner caches it by hash, so an unchanged knowledge base downloads nothing. Its hash stays out of the session fingerprint: a resumed session is told in its turn which documents changed since its last snapshot.

A conversation's run (the project assistant's) gets the same brief section, worded for answering questions, and no files: its knowledge is the system's and that of the projects the conversation's page contexts name, newest first (at most five, as the person sees them, `server/knowledge/conversation.ts`), and it reads them with `nb-studio kb search`, `read`, `tree` and `list`, which in a conversation cover those spaces together; `--project` reads another project the person sees. It proposes only when the person asks to keep something.

A runner without the `mounts` feature runs without the files, and the brief points at `nb-studio kb read` instead. `nb-studio kb list | tree | read | search | download | propose | upload` read and propose from the CLI, for a person (session or API key, its scope honoured) and for a run (its token, only with the `kb.knowledge` actions its agent is configured with); they are Studio's routes under `/api/kb` (`server/knowledge/routes.ts`), which name a document by slug or id across the spaces read and take `projectId` (`--project`), defaulting to the run's issue's project, a conversation's projects, or the system's. `nb-studio kb propose --changed` sends the files the agent changed or added in the mount (compared with `.manifest.json`, the route's `x-cli` `changedFiles`) as `multipart/form-data` parts named `files`, and makes one proposal of each, refusing a file's extracted text. `nb-studio kb upload --file <path>` proposes a file, a new one or with `--doc` a file's new version: `POST /api/kb/uploadTickets` answers a one-time ticket and the CLI streams the file to the plugin's `/api/knowledge/tickets/:ticketId/redeem` (`x-cli` `ticketUpload`). The plugin's own routes are the rest of `nb-studio kb` for people: `kb doc …` (create, upload, update, move, archive, restore, verify, reparse, replace-file, version list/get, permission get/set, access get), `kb proposal …` (list, get, download, accept, reject, withdraw), `kb subject list`, and `kb settings get|set` for the search settings; the plugin routes the views already cover (its spaces, search, document, file and proposal-creation routes) stay off the command line.

Skills are still delivered by their own path (`RunPayload.skills`). They could move onto mounts later: a skill bundle is a mount with a target the coding tool reads.

## The user manual and the retrospective

- The manual is the system document `manual` and the pages below it. While an issue is in a status of the `started` category, an agent that may propose is told to check the pages its change affects, propose updates or `--verify` them, and end its delivery comment with the manual line, in the installation's language (`knowledge.manual.*` in `server/locales`).
- The `retrospective` status rule, for finished statuses, wakes an agent (the one it names, or the issue's agent executor) on the issue in a thread of its own, acting for whoever finished it, to look back on it: the manual first, then what else is worth keeping. It never makes the agent the executor.
- Only that run gets the brief's "Capture learnings" section. It keeps what reading the code cannot tell and will be needed again — a team convention, an external system's pitfall, a trade-off a person made and why — and not a bug's analysis, facts the code shows, or a log of the task; it prefers updating the document that covers the area over adding one. A conversation proposes only when the person asks.

## Search

`nb-studio kb search` (`GET /api/kb/search`, and `kb list --q`, the knowledge view's ⌘K search and its search test, `GET /api/knowledge/search`) asks every search provider registered with the plugin and fuses their rankings with weighted Reciprocal Rank Fusion (k = 60) (the plugin's `server/services/search.ts`), drops what falls under the minimum relevance, then lets a reranker reorder the best of them. Two providers rank: the plugin's built-in contains match, and Studio's vector search when it is set up (hybrid search); each hit carries every provider's rank and score, its fused `score`, and the rerank score when a rerank model reordered it.

- **Contains match.** The query is split into words at whitespace (at most eight). A hit is a document whose title contains every word, or a section of a current version (`kbChunks`: an article's text or a file's extracted text) whose text contains every word. Each word is a case-insensitive `LIKE` through the repository, so it runs on SQLite, PostgreSQL and MySQL alike and Chinese needs no word splitting. It ranks title matches first, then the most recently updated document, then the section's place in it. At most 500 documents and 500 sections are read per search, so a very broad word is cut off rather than ranked; narrow the query.
- **Vector search** (`server/knowledge/vectors.ts`). Studio keeps the agents plugin's vector collection `studio-knowledge`: one item per section of a live entry's current version (`<docId>:<ordinal>`, with `{ spaceKey, docId, version, chunkId, gate }`, `gate` being the section's access gate), embedded with the embedding model chosen in Settings › Knowledge search, in the agents plugin's vector store (see "Vector store" below). Each `chunks.changed` of the plugin (a new version, a file's text extracted, an entry archived or restored) replaces the entry's items through the collection's queue, which embeds in batches, skips sections whose text did not change and retries failures. The `vector` provider embeds the query and asks for the nearest sections with the asker's readable gates as a filter in the store's own query, before its top-k, so a restricted section never takes a place in the top-k. A change of a node's permissions re-reads its entries, which updates only their gates. Changing the embedding model builds a new index in the background from every section, the old one answering until it is ready. Without an embedding model, or without a usable vector store, search is the contains match alone and the settings page says why.
- **Ranking** (Settings › Knowledge search, `recall`): the result count when a search names none (20), the minimum relevance (0: a hit's fused score over what a hit ranked first by every provider that answered would get, so 1 is the best), the keyword weight (0.5: the contains match weighs `2 × w` and the vector provider `2 × (1 − w)`, so 0.5 is plain RRF) and how many fused hits the rerank model reads (50). The defaults are the behaviour before these settings existed. The search test (a space's "…" menu) shows each hit's relevance, keyword and semantic ranks, rerank score and lines, from `GET /api/knowledge/search?explain=true`, which explains only to someone who manages the space or the search settings.
- **Reranking.** With a rerank model chosen, the best fused hits (at most the ranking's rerank candidates, 50 by default) are reordered by it; without one, or when it fails, the fused order stands.
- **Sections.** Documents are cut at headings down to level 3, a section over 2000 characters cut between paragraphs towards 1200; the settings' `chunking` changes that default and a space's manager may set its own (`/api/knowledge/chunking`, the space's "…" menu). A change cuts the spaces it applies to again in the background, rewriting only the documents whose sections change, which the vector index then follows.
- **Index state.** Studio answers the plugin's indexer from the collection's entries: a document's header says whether its sections are indexed, being indexed (how many of how many) or failed (the reason on hover, and "Index again" for an editor), its "…" menu lists its sections with theirs, and a space's home lists the documents not fully indexed (`GET /api/knowledge/docs/:docId/index`, `POST …/reindex`, `GET /api/knowledge/indexing`).
- **Adding context to sections** (Anthropic's contextual retrieval), off by default: for the spaces turned on in the settings, and only with a context model (a cheap chat model) chosen, each section is embedded after one sentence situating it in its document, which that model writes once per section text and Studio keeps (`studioKbContexts`); a changed section gets a new sentence, and turning it on or off for a space re-embeds that space.
- Each hit names its document and its kind, the version it read, the space, the headings above the section, its anchor, its lines and an excerpt; `kb search` adds the page's link at that anchor and merges the views of several spaces by score.
- It searches on behalf of the person asking: providers are given only what they read at query time (each space with its gates), and a section outside them, left from an older version or of an archived document is dropped before ranking. The index is never the source of permissions.

### Vector store

The vectors live apart from the application's database, in the store `agents.vectors` of `config.yml` names; the index registry and the embedding queue (`agVectorIndexes`, `agVectorEntries`) stay in the application's database, so they change in the same transactions as the knowledge they follow.

- **sqlite-vec** (the default, `server/config/agents.ts`): a SQLite file of its own, `storage/vectors.sqlite`, with the sqlite-vec extension. Nothing to install or run, so semantic search works as soon as an embedding model is chosen. It serves one instance; it is not available on musl (Alpine) builds, which have no sqlite-vec binary.
- **pgvector**: a PostgreSQL database of its own with the `vector` extension (created when missing, which needs the right to), for several instances or a large knowledge base. It never reuses the application's database connection.
- `store: false` turns semantic search off; search is then by keywords only.

```yaml
agents:
  vectors:
    store: sqlite-vec # the default
    path: storage/vectors.sqlite # relative to the application root
    # store: pgvector
    # url: postgres://vectors:${VECTORS_DB_PASSWORD}@db.internal:5432/vectors # or host, port, database, user, password
    # ssl: true
```

Pointing the store elsewhere (another type, file or database) builds the index again there in the background from every section; until it is ready, search is by keywords only, and the old index is retired. Its vectors stay where they were and can be deleted by hand.

Settings › Knowledge search shows at the top whether keyword and semantic search are available, and why semantic search is not, by code: `VECTORS_OFF`, `SQLITE_VEC_UNSUPPORTED` (no sqlite-vec binary for this platform), `SQLITE_VEC_OPEN_FAILED` (the file cannot be created or opened), `PGVECTOR_NOT_CONFIGURED` (no `url` or `host`), `PGVECTOR_CONNECTION_FAILED`, `PGVECTOR_EXTENSION_MISSING` (install pgvector on that server, or create the extension as a superuser), `VECTOR_STORE_UNKNOWN`, `VECTOR_STORE_FAILED`. Its vector store block shows the store type, where it points with no password, and how many sections each index holds of all of them.

Model calls for embeddings, reranking and context sentences are recorded by the agents plugin as usage of the source `studio.knowledge`, priced like chat models.

Online agents read knowledge the same way as anyone: `nb-studio kb list`, `tree`, `read` and `search` in their sandboxed shell, like any other command, and `kb search` is the hybrid search above. When everything an online agent reads for the person is estimated below the settings' token threshold (150,000 by default; a token per CJK character and per four other characters), it is put whole into the agent's system prompt instead, cached by the model service, and the agent answers from it (`server/knowledge/brief.ts`, `wholeSection`).

The sections stay because search and its citations use them: a hit is a section with its anchor and lines, which is what an agent quotes and a reader opens. They are cut at the h1–h3 headings of each new version, in its transaction (the plugin's `chunks.ts`).

Another search joins these rather than replacing them: a provider registered through the plugin's `registerSearchProvider` is fused the same way, such as a database full-text index (reserved: SQLite FTS5 with the trigram tokenizer, PostgreSQL `pg_trgm`) or the commercial knowledge-base plugin's vector search, which would need a public, versioned search service taking a metadata filter (the spaces the asker reads) and a global `topK`, and keep each hit's section id so it can be cited.
