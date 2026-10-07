# Permissions on folders and articles

A space's access is the application's: its resolver (`knowledgeAccessToken`) says what a reader may do in each space, from its roles and its own notion of who is related to a space. Below a space, every folder, article and file (a node) may narrow or widen that, the way mainstream wikis do: Notion's page-level sharing (Full access, Can edit, Can comment, Can view), Feishu wiki's 可阅读 / 可编辑 / 可管理 with "inherit the parent's tree" or "customize this subtree", and Confluence, whose edit restrictions not inheriting is a long-standing complaint, which is why every level here inherits. Retrieval follows permission-aware RAG (Glean and the like): the access check runs inside the retrieval query, never on the results afterwards alone.

## Levels

`read < propose < edit < manage`, each including the ones below it:

| Level     | What it allows                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------- |
| `read`    | read the node, its versions and its file, find it in search, see it in the tree and in snapshots   |
| `propose` | propose a change to it, a new node under it, or that it still holds                                |
| `edit`    | edit, rename, move, archive, restore and mark it verified; add under it; decide proposals about it |
| `manage`  | `edit`, and change the node's permissions                                                          |

An actor that is not a person (an agent) holds at most `propose`. An agent acting for a person gets the intersection of its own access and that person's: each is evaluated with its own subjects (the agent's, such as `agent:<id>`, and the person's), both from the same space default, and the lower of the two applies, capped at `propose`.

## The space default

The application's resolver answers `{ read, propose, edit, manage }` for a space, normalized to one level (no level without `read`). That is the root of every node's inheritance. `manage` is a business action of its own, `kb.knowledge/manage`, beside `read`, `propose` and `edit`, so an application can grant it in its roles: The assembling application gives it to a project's lead in their project's space and to the administrators (and the roles that hold it at all) in the system space.

Whoever has `manage` on the space keeps `manage` on every node, whatever a node says (anti-lockout): a custom node can hide documents from the space's audience, never from the people responsible for the space.

## Nodes

Every node has a mode and its own entries:

- **`inherit`** (the default): the node's access is its parent's (the space default at the root) plus its own entries. A reader matching several entries, or an entry and the inherited access, gets the highest level; nothing is ever denied by an entry.
- **`custom`**: only the node's own entries apply, independent of its ancestors, like Feishu's custom subtree. Its descendants in `inherit` mode follow it.

An entry is `{ subject: { type, id }, level }` with a level from `read` to `manage`. There is no explicit deny. An entry may name a subject outside the space's default audience: a node can be shared with someone who cannot read the rest of the space, as a Notion page can be shared beyond its teamspace. Such a reader sees the space with only the nodes they may read; a readable node whose parent they may not read appears at the nearest readable ancestor, or at the top.

A new node starts in `inherit` mode with no entries. Moving a node keeps its mode and entries; what it inherits becomes its new parent's.

Switching a node to `custom` in the view starts its entries from the inherited ones, so nobody loses access by surprise; the person switching sees who will keep it before saving.

## Subjects

The plugin knows no users, roles or groups. A subject is a pair `{ type, id }` whose type the application declares by registering a `KnowledgeSubjectProvider` (`Knowledge.registerSubjectProvider`):

| Member                             | What it answers                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `type`, `title`, `icon`            | the type (`[a-z][a-z0-9-]{0,31}`), its title for the picker's group (plain text or an i18n key) and its icon |
| `search(q, { space, limit })`      | subjects of this type to offer in the picker, best first, with their labels                                  |
| `describe(ids, { space })`         | the labels of stored subjects, to show a node's entries; an unknown id is left out and shown as removed      |
| `subjectsOf(principal, { space })` | the ids of this type a principal (`{ kind: 'user' \| <actor kind>, id }`) belongs to, in that space          |

Access is evaluated by resolving the reader to its subjects (every provider's `subjectsOf`, once per space and request) and matching them against the stored entries. Membership is therefore read at query time: adding someone to a role, a project or a group changes what they read immediately, and nothing is reindexed.

A future type is one provider entry and nothing else. A `department` type, for example, offers the departments in `search` (and an "include sub-departments" choice as a second id, `<departmentId>` or `<departmentId>/*`), and its `subjectsOf(user)` answers the user's own department and, for each of its ancestors, `<ancestorId>/*`. The knowledge plugin, its tables and the stored entries do not change; existing entries keep their meaning.

## Effective access and where it comes from

For a node the plugin answers a level and its source: the space default, the space's managers (anti-lockout), or an entry, with the node it is on and its subject. The view shows it at the top of the entry's permissions ("You can edit · from Project members on Runbooks"), and `GET /api/knowledge/docs/{docId}/access` answers it for any reader of the node.

## Retrieval

Every node has an `aclKey`: the id of its nearest ancestor-or-self that has entries or is `custom`, or null when there is none (then the space default decides). Every node under an `aclKey` has exactly that node's access, so the key is all a retrieval filter needs. It is stored on the node (`kbDocs.aclKey`) and on its sections (`kbChunks.aclKey`), and an index of the application's own keeps it with each section as a gate, `space:<spaceId>` when the key is null and `node:<aclKey>` otherwise (`accessGate`).

A reader's readable gates, per space, are `space:<spaceId>` when the space default lets them read, and `node:<id>` for each node with entries or in `custom` mode whose effective level lets them read. Every retrieval path filters by them inside its query:

- the contains search (`kbChunks` and `kbDocs`): `(spaceId in default-readable spaces and aclKey is null) or aclKey in readable keys`;
- a search provider of the application's gets the spaces with their `gates` and filters inside its own query: an application's vector search passes `{ gate: { in: gates } }` to the vector store, which pgvector applies in its `WHERE` before the top-k;
- the whole knowledge in an agent's prompt (`texts`), outlines and snapshots read only the nodes under readable gates.

Whatever a provider answers, the plugin checks each section's gate against the reader's again before ranking, so a stale index never leaks a section.

The keys change only when a node's mode or entries change (its subtree's keys are recomputed in the same transaction) or when a node moves (its subtree takes its new parent's). Each node whose key changed announces `chunks.changed`, so an index updates the gates of its sections; unchanged text is not embedded again. Membership changes recompute nothing.

## API

All under `/api/knowledge`, signed in, refusals in the standard error body with domain `knowledge`:

| Method and path                                    | What it does                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET /docs/{docId}/permissions`                    | the node's mode, its entries with their subjects' labels, what it inherits from where (`manage`)    |
| `PUT /docs/{docId}/permissions`                    | replaces the mode and the entries (`manage`); answers them again                                    |
| `GET /docs/{docId}/access`                         | the viewer's effective level on the node and its source, the mode and the number of entries         |
| `GET /subjects?scope=&scopeId=&q=&type=&pageSize=` | subjects to grant, grouped by type in `meta.types` (for someone who manages something in the space) |

A reader without `read` on a node gets 404 for it, the same as for a missing one; with `read` but without `manage`, 403 on the permissions.

## Tables

| Table         | Columns                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `kbDocs`      | `accessMode` (`inherit` or `custom`), `aclKey`                                                               |
| `kbChunks`    | `aclKey`, copied from the node                                                                               |
| `kbDocAccess` | one entry per node and subject: `docId`, `spaceId`, `subjectType`, `subjectId`, `level`, who set it and when |
