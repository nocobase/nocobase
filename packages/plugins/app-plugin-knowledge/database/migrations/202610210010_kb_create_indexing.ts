import { randomUUID } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/** Business control, source revisions, applied watermarks and admission receipts; not an execution queue. */
const migration: MigrationDefinition = defineMigration({
  name: '202610210010_kb_create_indexing',
  async up({ builder, query }) {
    await builder.createCollection('kbIndexingSettings', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('namespace', { length: 64 }).notNull();
      c.bigInt('revision').notNull().defaultTo(0);
      c.bigInt('sourceSeq').notNull().defaultTo(0);
      c.json('config').nullable();
      c.string('configHash', { length: 64 }).nullable();
      c.string('activeGenerationId', { length: 64 }).nullable();
      c.string('buildingGenerationId', { length: 64 }).nullable();
      c.string('lockNonce', { length: 64 }).notNull();
      c.string('updatedByKind', { length: 32 }).nullable();
      c.string('updatedById', { length: 64 }).nullable();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
    });
    await builder.createCollection('kbIndexGenerations', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.bigInt('configRevision').notNull();
      c.string('instanceKey', { length: 64 }).notNull();
      c.string('type', { length: 64 }).notNull();
      c.integer('contractVersion').notNull();
      c.json('config').notNull();
      c.string('configHash', { length: 64 }).notNull();
      c.string('resourceHash', { length: 64 }).notNull();
      c.string('embeddingHash', { length: 64 }).nullable();
      c.integer('dimension').nullable();
      c.json('target').notNull();
      c.string('state', { length: 16 }).notNull();
      c.string('scanCursor', { length: 64 }).nullable();
      c.boolean('scanComplete').notNull().defaultTo(false);
      c.string('errorReason', { length: 96 }).nullable();
      c.string('errorMessage', { length: 500 }).nullable();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.datetimeTz('publishedAt').nullable();
      c.datetimeTz('retiredAt').nullable();
      c.datetimeTz('cleanupAfter').nullable();
      c.index(['state', 'cleanupAfter']);
      c.index(['configRevision']);
    });
    await builder.createCollection('kbIndexSources', (c) => {
      c.string('docId', { length: 64 }).primary().notNull();
      c.string('spaceId', { length: 64 }).notNull();
      c.bigInt('revision').notNull();
      c.boolean('deleted').notNull();
      c.bigInt('forceEmbeddingRevision').notNull().defaultTo(0);
      c.datetimeTz('updatedAt').notNull();
      c.index(['spaceId', 'revision']);
    });
    await builder.createCollection('kbIndexWork', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('generationId', { length: 64 }).notNull();
      c.string('docId', { length: 64 }).notNull();
      c.bigInt('wantedRevision').notNull();
      c.bigInt('appliedRevision').notNull().defaultTo(0);
      c.string('state', { length: 16 }).notNull();
      c.string('dispatchId', { length: 64 }).nullable();
      c.string('lastJobId', { length: 128 }).nullable();
      c.datetimeTz('lastDispatchedAt').nullable();
      c.datetimeTz('lastActivityAt').nullable();
      c.bigInt('observedRevision').nullable();
      c.integer('totalChunks').notNull().defaultTo(0);
      c.integer('preparedChunks').notNull().defaultTo(0);
      c.bigInt('errorRevision').nullable();
      c.boolean('errorRetryable').nullable();
      c.string('errorReason', { length: 96 }).nullable();
      c.string('errorMessage', { length: 500 }).nullable();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.unique(['generationId', 'docId']);
      c.index(['generationId', 'state']);
      c.index(['state', 'lastActivityAt']);
      c.belongsTo('generation', 'kbIndexGenerations')
        .targetKey('id')
        .foreignKey('generationId')
        .constraints(true)
        .onDelete('cascade');
    });
    await builder.createCollection('kbIndexRequests', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('principalType', { length: 32 }).notNull();
      c.string('principalId', { length: 64 }).notNull();
      c.string('requestId', { length: 36 }).notNull();
      c.string('operation', { length: 16 }).notNull();
      c.string('payloadHash', { length: 64 }).notNull();
      c.json('receipt').notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('expiresAt').notNull();
      c.unique(['principalType', 'principalId', 'requestId']);
      c.index(['expiresAt']);
    });
    const now = new Date().toISOString();
    await query
      .insertInto('kbIndexingSettings')
      .values({
        id: 'global',
        namespace: randomUUID(),
        revision: '0',
        sourceSeq: '0',
        config: null,
        configHash: null,
        activeGenerationId: null,
        buildingGenerationId: null,
        lockNonce: randomUUID(),
        updatedByKind: null,
        updatedById: null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
  async down({ builder }) {
    await builder.dropCollection('kbIndexRequests');
    await builder.dropCollection('kbIndexWork');
    await builder.dropCollection('kbIndexSources');
    await builder.dropCollection('kbIndexGenerations');
    await builder.dropCollection('kbIndexingSettings');
  },
});
export default migration;
