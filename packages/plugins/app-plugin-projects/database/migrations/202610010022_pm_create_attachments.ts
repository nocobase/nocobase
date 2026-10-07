import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Files on issues and comments, and the uploads not attached yet (an intake's files, a comment being written), stored
// through the file plugin's repository: its fixed file columns, who uploaded the file (a kind's key and an id), and
// where it is attached. A comment's files carry the comment's issue too, so reading them follows the issue. An upload
// attached to nothing is visible to its uploader only and is purged a day later.

const migration: MigrationDefinition = defineMigration({
  name: '202610010022_pm_create_attachments',

  async up({ builder }) {
    await builder.createCollection('pmAttachments', (collection) => {
      collection.uuid('id').primary().notNull();
      collection.string('disk', { length: 255 }).notNull();
      collection.text('key').notNull();
      collection.text('filename').notNull();
      collection.string('ext', { length: 32 }).notNull();
      collection.string('mimeType', { length: 255 }).notNull();
      collection.bigInt('size').notNull();
      // A kind's key (`shared/kinds.ts`): `user`, or the kind of an agent that uploaded it while working.
      collection.string('uploaderType', { length: 32 }).notNull();
      collection.string('uploaderId', { length: 64 }).notNull();
      collection.string('issueId', { length: 64 }).nullable();
      collection.string('commentId', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.index(['issueId', 'commentId'], {
        name: 'pm_attachments_issue_idx',
      });
      collection.index(['commentId'], { name: 'pm_attachments_comment_idx' });
      collection.index(['uploaderType', 'uploaderId', 'createdAt'], {
        name: 'pm_attachments_uploader_idx',
      });
      // The purge finds the files of deleted comments through it.
      collection
        .belongsTo('comment', 'pmComments')
        .targetKey('id')
        .foreignKey('commentId')
        .constraints(false);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('pmAttachments');
  },
});

export default migration;
