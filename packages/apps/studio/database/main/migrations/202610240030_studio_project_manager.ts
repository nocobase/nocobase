import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// One project manager arranges every issue given to agents, and the workflows' stages are gone. This migration
//
// - hands every issue an agent executes to the project manager (`studio-project-manager`); the agents plugin's
//   migration removed the agents that executed them. Nothing is woken: an open issue shows "Hand over to the project
//   manager" until someone does;
// - deletes the stage loop guards (`studioStageRunGuards` rows other than the comment guard, `@comments`);
// - withdraws the decisions still waiting in the inbox on what no longer exists: approval requests, design proposals
//   to review, stage rule problems and executor suggestions. The items stay, settled, like any withdrawn card;
// - adds the repository switch that wakes the project manager when all checks of a pull request's head passed.
//
// `down` drops the switch. Executors, guards and decisions are not restored.
//
// Self-contained on purpose: nothing is imported from server/ or shared/.

const PROJECT_MANAGER_ID = 'studio-project-manager';
const COMMENT_GUARD_STATUS = '@comments';

const WITHDRAWN = 'withdrawn';

const REMOVED_DECISION_TYPES = [
  'approval_requested',
  'design_review',
  'stage_action_problem',
  'executor_suggested',
];

const migration: MigrationDefinition = defineMigration({
  name: '202610240030_studio_project_manager',

  async up({ builder, query }: MigrationContext): Promise<void> {
    await builder.alterCollection('studioGitRepos', (collection) => {
      collection.boolean('wakeOnChecksPassed').notNull().defaultTo(true);
    });

    // The projects plugin owns the issues; an application without it has none to hand over.
    if (await builder.hasCollection('pmIssues'))
      await query
        .updateTable('pmIssues')
        .set({ executorId: PROJECT_MANAGER_ID })
        .where('executorType', '=', 'agent')
        .where('executorId', '<>', PROJECT_MANAGER_ID)
        .execute();

    await query
      .deleteFrom('studioStageRunGuards')
      .where('statusKey', '<>', COMMENT_GUARD_STATUS)
      .execute();

    await query
      .updateTable('studioInboxNotices')
      .set({ resolvedAt: new Date().toISOString(), outcome: WITHDRAWN })
      .where('source', '=', 'projects')
      .where('kind', '=', 'decision')
      .where('type', 'in', REMOVED_DECISION_TYPES)
      .where('resolvedAt', 'is', null)
      .execute();
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('studioGitRepos', (collection) => {
      collection.dropField('wakeOnChecksPassed');
    });
  },
});

export default migration;
