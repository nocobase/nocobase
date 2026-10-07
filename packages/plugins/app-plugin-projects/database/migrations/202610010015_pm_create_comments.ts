import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Comments on issues and their reactions. A comment is soft-deleted: its row stays (with its text, for the record)
// so replies keep their thread. No optimistic lock: comments are written by their author only.

const migration: MigrationDefinition = defineMigration({
  name: '202610010015_pm_create_comments',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmComments',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          // A kind's key (`shared/kinds.ts`); `authorId` is null for `system`.
          collection.string('authorType', { length: 32 }).notNull();
          collection.string('authorId', { length: 64 }).nullable();
          // `comment` from the browser; other plugins write their own kinds.
          collection
            .string('kind', { length: 32 })
            .notNull()
            .defaultTo('comment');
          collection.text('content').notNull();
          collection.string('parentId', { length: 64 }).nullable();
          // A root's `rootId` is its own id.
          collection.string('rootId', { length: 64 }).notNull();
          // What the writing plugin wants to trace, such as `{ runId }`; never returned.
          collection.json('origin').nullable();
          // `cli` or `api_key` when a person wrote it without the browser.
          collection.string('via', { length: 16 }).nullable();
          collection.datetimeTz('editedAt').nullable();
          collection.datetimeTz('deletedAt').nullable();
          collection.string('deletedByType', { length: 32 }).nullable();
          collection.string('deletedById', { length: 64 }).nullable();
          // Roots only.
          collection.datetimeTz('resolvedAt').nullable();
          collection.string('resolvedById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['issueId', 'parentId', 'createdAt'], {
            name: 'pm_comments_issue_parent_idx',
          });
          collection.index(['rootId', 'createdAt'], {
            name: 'pm_comments_root_idx',
          });
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // One person's reaction with one emoji to one comment.
        name: 'pmCommentReactions',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('commentId', { length: 64 }).notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.string('emoji', { length: 16 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['commentId', 'userId', 'emoji'], {
            name: 'pm_comment_reactions_unique',
          });
          collection
            .belongsTo('comment', 'pmComments')
            .targetKey('id')
            .foreignKey('commentId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmCommentReactions');
    await builder.dropCollection('pmComments');
  },
});

export default migration;
