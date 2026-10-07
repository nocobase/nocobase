import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The knowledge base: spaces of entries in a tree (folders, Markdown articles and files), every saved version kept
// whole, who may do what on each entry, the heading-based chunks search reads, the stored files, proposals, upload
// tickets, and the snapshots exported. What the application's spaces belong to (a project), and its
// runs and issues, are named by id only: their tables are the application's.
const migration: MigrationDefinition = defineMigration({
  name: '202610030010_kb_create_tables',

  async up({ builder }) {
    await builder.createCollections([
      {
        // One tree of documents, named by the application's kind (`scope`) and key (`scopeId`, possibly empty), made
        // the first time a document is created there.
        name: 'kbSpaces',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('scope', { length: 16 }).notNull();
          collection.string('scopeId', { length: 64 }).notNull().defaultTo('');
          // Reserved for what a space may later configure (pinned documents, what is materialized).
          collection.json('settings').notNull().defaultTo({});
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['scope', 'scopeId']);
        },
      },
      {
        // An entry at its current version: the title, summary and content hash are copies of that version's, for
        // lists; the content is read from the version. A folder has a name and a place only: no versions (version
        // 0, an empty hash).
        name: 'kbDocs',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('spaceId', { length: 64 }).notNull();
          // `folder`, `article` (Markdown) or `file`.
          collection
            .string('kind', { length: 16 })
            .notNull()
            .defaultTo('article');
          collection.string('parentId', { length: 64 }).nullable();
          collection.integer('sortOrder').notNull().defaultTo(0);
          collection.string('slug', { length: 64 }).notNull();
          collection.string('title', { length: 200 }).notNull();
          collection.string('summary', { length: 300 }).notNull().defaultTo('');
          collection.integer('currentVersion').notNull().defaultTo(1);
          collection.string('contentHash', { length: 64 }).notNull();
          // When someone last confirmed it still holds, and who.
          collection.datetimeTz('verifiedAt').nullable();
          collection.string('verifiedById', { length: 64 }).nullable();
          collection.datetimeTz('archivedAt').nullable();
          collection.string('createdById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          // Who wrote the current version: `user` or the kind of an actor (`agent`), and their id.
          collection.string('updatedByKind', { length: 16 }).notNull();
          collection.string('updatedById', { length: 64 }).nullable();
          collection.datetimeTz('updatedAt').notNull();
          // `inherit` (its parent's access plus its own entries) or `custom` (its own entries alone).
          collection
            .string('accessMode', { length: 16 })
            .notNull()
            .defaultTo('inherit');
          // The nearest entry at or above it with entries of its own or in `custom` mode; null when the space's
          // access decides. What retrieval filters by.
          collection.string('aclKey', { length: 64 }).nullable();
          collection.unique(['spaceId', 'slug']);
          collection.index(['spaceId', 'parentId']);
          collection.index(['spaceId', 'aclKey']);
          collection
            .belongsTo('space', 'kbSpaces')
            .targetKey('id')
            .foreignKey('spaceId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // Every version of an article or a file, whole, with where it came from: its author, the run or conversation
        // behind it, the proposal it applied and who approved it. A file's version names its stored file, and its
        // content is the text extracted from it as Markdown (empty until parsed).
        name: 'kbDocVersions',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('docId', { length: 64 }).notNull();
          collection.integer('version').notNull();
          collection.string('title', { length: 200 }).notNull();
          collection.string('summary', { length: 300 }).notNull().defaultTo('');
          collection.text('content').notNull();
          // An article's: SHA-256 of the content; a file's: of the file's bytes.
          collection.string('contentHash', { length: 64 }).notNull();
          collection.string('fileId', { length: 64 }).nullable();
          // A file's text: `parsing`, `ready`, `failed` or `unsupported`; null for an article.
          collection.string('parseStatus', { length: 16 }).nullable();
          collection.string('parseError', { length: 500 }).nullable();
          collection.string('authorKind', { length: 16 }).notNull();
          collection.string('authorId', { length: 64 }).nullable();
          // What it came from, as `{ kind, id }` (an issue, a conversation); never a foreign key.
          collection.string('sourceKind', { length: 32 }).nullable();
          collection.string('sourceId', { length: 64 }).nullable();
          collection.string('sourceTitle', { length: 255 }).nullable();
          collection.string('runId', { length: 64 }).nullable();
          collection.string('proposalId', { length: 64 }).nullable();
          collection.string('approvedById', { length: 64 }).nullable();
          collection.string('note', { length: 500 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['docId', 'version']);
          // What is still being parsed, picked up again at start.
          collection.index(['parseStatus']);
          collection
            .belongsTo('doc', 'kbDocs')
            .targetKey('id')
            .foreignKey('docId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // Who may do what on an entry beyond what it inherits: one level (`read`, `propose`, `edit` or `manage`) per
        // subject, a type the application declares (`user`, `role`…) and its id there.
        name: 'kbDocAccess',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('docId', { length: 64 }).notNull();
          collection.string('spaceId', { length: 64 }).notNull();
          collection.string('subjectType', { length: 32 }).notNull();
          collection.string('subjectId', { length: 128 }).notNull();
          collection.string('level', { length: 16 }).notNull();
          collection.string('createdById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['docId', 'subjectType', 'subjectId']);
          collection.index(['spaceId']);
          collection
            .belongsTo('doc', 'kbDocs')
            .targetKey('id')
            .foreignKey('docId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // The current version of each document cut at its headings: what keyword search reads and a citation points
        // at. Derived: rewritten in the transaction that writes each version, and rebuildable from the versions.
        name: 'kbChunks',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('docId', { length: 64 }).notNull();
          collection.string('spaceId', { length: 64 }).notNull();
          collection.integer('version').notNull();
          collection.integer('ordinal').notNull();
          // The headings above the chunk, outermost first.
          collection.json('headingPath').notNull().defaultTo([]);
          collection.string('anchor', { length: 200 }).nullable();
          collection.integer('lineStart').notNull();
          collection.integer('lineEnd').notNull();
          collection.text('text').notNull();
          collection.integer('charCount').notNull();
          collection.string('hash', { length: 64 }).notNull();
          // The entry's `aclKey`, so search filters by access in its own query.
          collection.string('aclKey', { length: 64 }).nullable();
          collection.index(['docId']);
          collection.index(['spaceId']);
          collection.index(['aclKey']);
          collection
            .belongsTo('doc', 'kbDocs')
            .targetKey('id')
            .foreignKey('docId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // A change an actor (an agent) or a person without the right to edit suggests: a new version of a document, a
        // new document, or confirming one still holds. Someone who may edit the space decides it.
        name: 'kbProposals',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('spaceId', { length: 64 }).notNull();
          // The document it changes; null for a new document until it is accepted.
          collection.string('docId', { length: 64 }).nullable();
          // `update`, `create` or `verify`.
          collection.string('kind', { length: 16 }).notNull();
          // A new document's parent and slug.
          collection.string('parentId', { length: 64 }).nullable();
          collection.string('slug', { length: 64 }).nullable();
          collection.string('title', { length: 200 }).nullable();
          collection.string('summary', { length: 300 }).nullable();
          collection.text('content').nullable();
          collection.string('contentHash', { length: 64 }).nullable();
          // A new file, or a file's replacement: the upload it proposes (`kbFiles`).
          collection.string('fileId', { length: 64 }).nullable();
          // The version the proposal was written against.
          collection.integer('baseVersion').nullable();
          collection.string('reason', { length: 500 }).notNull();
          // Who proposed (`user`, or the kind of an actor such as `agent`), and the person they acted for.
          collection.string('proposerKind', { length: 16 }).notNull();
          collection.string('proposerId', { length: 64 }).notNull();
          collection.string('authorizedById', { length: 64 }).notNull();
          collection.string('sourceKind', { length: 32 }).nullable();
          collection.string('sourceId', { length: 64 }).nullable();
          collection.string('sourceTitle', { length: 255 }).nullable();
          collection.string('sourceUrl', { length: 500 }).nullable();
          collection.string('runId', { length: 64 }).nullable();
          // `pending`, `accepted`, `rejected` or `withdrawn`.
          collection.string('status', { length: 16 }).notNull();
          collection.string('decidedById', { length: 64 }).nullable();
          collection.datetimeTz('decidedAt').nullable();
          collection.string('comment', { length: 1000 }).nullable();
          collection.integer('appliedVersion').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['status']);
          collection.index(['docId', 'status']);
          collection.index(['runId']);
          collection.index(['sourceKind', 'sourceId']);
        },
      },
      {
        // The stored files: the file plugin's columns (the bytes are on a Drive disk under `key`), who uploaded each
        // (`user` or an actor's kind, and the id), and the SHA-256 of its bytes. A file belongs to the version or the
        // proposal that names it; one named by neither is an upload being proposed.
        name: 'kbFiles',
        definition: (collection) => {
          collection.uuid('id').primary().notNull();
          collection.string('disk', { length: 255 }).notNull();
          collection.text('key').notNull();
          collection.text('filename').notNull();
          collection.string('ext', { length: 32 }).notNull();
          collection.string('mimeType', { length: 255 }).notNull();
          collection.bigInt('size').notNull();
          collection.string('uploaderKind', { length: 16 }).notNull();
          collection.string('uploaderId', { length: 64 }).notNull();
          collection.string('sha256', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // A one-time upload of a file to propose, handed to a client that sends the file apart from its request (an
        // agent's command): who proposes, what (without the file), and the hash of the secret that redeems it.
        name: 'kbUploadTickets',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('tokenHash', { length: 64 }).notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.string('actorKind', { length: 16 }).nullable();
          collection.string('actorId', { length: 64 }).nullable();
          collection.string('runId', { length: 64 }).nullable();
          collection.json('request').notNull().defaultTo({});
          collection.datetimeTz('expiresAt').notNull();
          collection.datetimeTz('usedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
        },
      },
      {
        // What a snapshot exported: each document's version and path, under the application's key (a run's id). The
        // files are rebuilt from it, and a later snapshot of the same series (a session) says what changed since.
        name: 'kbSnapshots',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('snapshotKey', { length: 64 }).notNull();
          // SHA-256 of the series' key.
          collection.string('seriesKey', { length: 64 }).notNull();
          collection.string('hash', { length: 64 }).notNull();
          // [{ docId, kind, version, path, hash, slug, title, scope, … }]
          collection.json('docs').notNull().defaultTo([]);
          collection.integer('omitted').notNull().defaultTo(0);
          collection.datetimeTz('createdAt').notNull();
          collection.index(['snapshotKey']);
          collection.index(['seriesKey', 'createdAt']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('kbSnapshots');
    await builder.dropCollection('kbUploadTickets');
    await builder.dropCollection('kbFiles');
    await builder.dropCollection('kbProposals');
    await builder.dropCollection('kbChunks');
    await builder.dropCollection('kbDocAccess');
    await builder.dropCollection('kbDocVersions');
    await builder.dropCollection('kbDocs');
    await builder.dropCollection('kbSpaces');
  },
});

export default migration;
