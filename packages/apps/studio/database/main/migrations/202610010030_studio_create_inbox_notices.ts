import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610010030_studio_create_inbox_notices',

  async up({ builder }) {
    await builder.createCollections([
      {
        // What Studio knows about each inbox item beyond its text: one row per notification and recipient. The item
        // itself (text, read state, deletion) lives in the in-app notification plugin, found by `notificationId`.
        name: 'studioInboxNotices',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('notificationId', { length: 36 }).notNull();
          collection.string('userId', { length: 191 }).notNull();
          // Who sent it: the contributing package's id, such as `projects` (Studio's inbox port).
          collection.string('source', { length: 64 }).notNull();
          // `decision` (someone must act) or `info`.
          collection.string('kind', { length: 16 }).notNull();
          // What happened, such as `approval_requested`; the contributor's renderer words it.
          collection.string('type', { length: 64 }).notNull();
          // What it is about, when it is about one thing (an issue, an app); none for a notice about nothing in
          // particular.
          collection.string('subjectType', { length: 32 }).nullable();
          collection.string('subjectId', { length: 64 }).nullable();
          collection.string('subjectLabel', { length: 191 }).nullable();
          // The contributor's own key of the decision a `decision` asks for, by which it resolves it.
          collection.string('decisionKey', { length: 191 }).nullable();
          // The contributor's values, as JSON, so each reader sees the item worded in their own language.
          collection.json('data').nullable();
          // A decision stops waiting once resolved; `outcome` says how.
          collection.datetimeTz('resolvedAt').nullable();
          collection.string('outcome', { length: 64 }).nullable();
          // Information about the same thing merges into one item per user (the group is the source's): a newer
          // notice of the group replaces the older item (deleted from the in-app plugin, the row marked superseded)
          // and counts on from it.
          collection.string('groupKey', { length: 191 }).nullable();
          collection.integer('count').notNull().defaultTo(1);
          collection.datetimeTz('supersededAt').nullable();
          // Who did what the item tells.
          collection.string('actorType', { length: 32 }).nullable();
          collection.string('actorId', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['notificationId', 'userId'], {
            name: 'studio_inbox_notice_unique',
          });
          collection.index(['userId', 'kind', 'resolvedAt'], {
            name: 'studio_inbox_notice_user_idx',
          });
          collection.index(['userId', 'groupKey', 'supersededAt'], {
            name: 'studio_inbox_notice_group_idx',
          });
          collection.index(['source', 'decisionKey'], {
            name: 'studio_inbox_notice_decision_idx',
          });
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioInboxNotices');
  },
});

export default migration;
