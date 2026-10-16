import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Issues move through six fixed statuses (backlog, in_progress, blocked, in_review, done, cancelled) and workflows are
// gone, with the approvals and checklists their transitions and statuses held. This migration
//
// - moves every issue to a fixed status: first by its key (`todo`, `analysis` and `proposal_review` to in_progress,
//   `ui_review` to in_review, a fixed key stays), then, for a key no fixed status has, by the category the status has
//   in the issue's workflow (its project's, else the default one): `unstarted` and `started` to in_progress, `done` to
//   done, `closed` to cancelled; a key no workflow defines goes to backlog;
// - drops the workflows (`pmWorkflows`, `pmProjects.workflowId`), the approval requests (`pmApprovalRequests`) and the
//   checklist items (`pmIssueChecklistItems`).
//
// Nothing is woken: rows change directly. `down` recreates the dropped tables and column, empty, as the migrations that
// created them defined them; the issues keep their fixed statuses, since the old ones are not kept.
//
// Self-contained on purpose: the status keys and categories are written out here, not imported.

const BY_KEY: Readonly<Record<string, string>> = {
  backlog: 'backlog',
  todo: 'in_progress',
  analysis: 'in_progress',
  proposal_review: 'in_progress',
  in_progress: 'in_progress',
  blocked: 'blocked',
  in_review: 'in_review',
  ui_review: 'in_review',
  done: 'done',
  cancelled: 'cancelled',
};

const BY_CATEGORY: Readonly<Record<string, string>> = {
  unstarted: 'in_progress',
  started: 'in_progress',
  done: 'done',
  closed: 'cancelled',
};

const FALLBACK = 'backlog';
const CHUNK = 500;

/** A column read as text, or null. */
const text = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const parseJson = (value: unknown): unknown =>
  typeof value === 'string' ? JSON.parse(value) : value;

/** A workflow definition's status categories, by key. */
function categoriesOf(definition: unknown): Map<string, string> {
  const parsed = parseJson(definition) as { states?: unknown } | null;
  const states = Array.isArray(parsed?.states) ? parsed.states : [];
  const categories = new Map<string, string>();
  for (const state of states as { key?: unknown; category?: unknown }[])
    if (typeof state?.key === 'string' && typeof state.category === 'string')
      categories.set(state.key, state.category);
  return categories;
}

const migration: MigrationDefinition = defineMigration({
  name: '202610240010_pm_fixed_statuses',

  async up({ builder, query }) {
    // Statuses with a key of their own, everywhere at once.
    for (const [from, to] of Object.entries(BY_KEY))
      if (from !== to)
        await query
          .updateTable('pmIssues')
          .set({ statusKey: to })
          .where('statusKey', '=', from)
          .execute();

    // The rest by their category in the issue's workflow.
    const rest = await query
      .selectFrom('pmIssues')
      .select(['id', 'projectId', 'statusKey'])
      .where('statusKey', 'not in', Object.keys(BY_KEY))
      .execute();
    if (rest.length > 0) {
      const workflows = await query
        .selectFrom('pmWorkflows')
        .select(['id', 'isDefault', 'definition'])
        .execute();
      const byId = new Map(
        workflows.map((row) => [text(row.id), categoriesOf(row.definition)]),
      );
      const defaultId = text(
        workflows.find((row) => Boolean(row.isDefault))?.id,
      );
      const fallback = byId.get(defaultId) ?? new Map<string, string>();
      const projects = await query
        .selectFrom('pmProjects')
        .select(['id', 'workflowId'])
        .execute();
      const workflowOf = new Map(
        projects.map((row) => [text(row.id), text(row.workflowId)]),
      );
      const targets = new Map<string, string[]>();
      for (const issue of rest) {
        const projectId = text(issue.projectId);
        const workflowId =
          projectId === null ? null : (workflowOf.get(projectId) ?? null);
        const categories =
          (workflowId === null ? undefined : byId.get(workflowId)) ?? fallback;
        const category = categories.get(text(issue.statusKey) ?? '');
        const to = (category && BY_CATEGORY[category]) ?? FALLBACK;
        const id = text(issue.id);
        if (id !== null) targets.set(to, [...(targets.get(to) ?? []), id]);
      }
      for (const [to, ids] of targets)
        for (let at = 0; at < ids.length; at += CHUNK)
          await query
            .updateTable('pmIssues')
            .set({ statusKey: to })
            .where('id', 'in', ids.slice(at, at + CHUNK))
            .execute();
    }

    await builder.dropCollection('pmIssueChecklistItems');
    await builder.dropCollection('pmApprovalRequests');
    await builder.alterCollection('pmProjects', (collection) => {
      collection.dropField('workflowId');
    });
    await builder.dropCollection('pmWorkflows');
  },

  async down({ builder }) {
    await builder.createCollections([
      {
        name: 'pmWorkflows',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('name', { length: 100 }).notNull();
          collection.text('description').nullable();
          collection.boolean('isDefault').notNull().defaultTo(false);
          collection.string('builtInKey', { length: 64 }).nullable();
          collection.json('definition').notNull();
          collection.integer('revision').notNull().defaultTo(1);
          collection.optimisticLock('revision');
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['name']);
        },
      },
    ]);
    await builder.alterCollection('pmProjects', (collection) => {
      collection.string('workflowId', { length: 64 }).nullable();
    });
    await builder.createCollections([
      {
        name: 'pmApprovalRequests',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('fromStatus', { length: 32 }).notNull();
          collection.string('toStatus', { length: 32 }).notNull();
          collection.string('requestedByType', { length: 32 }).notNull();
          collection.string('requestedById', { length: 64 }).notNull();
          collection.json('approvers').notNull();
          collection.json('approverUserIds').notNull();
          collection
            .enum('status', {
              values: ['pending', 'approved', 'rejected', 'withdrawn', 'stale'],
            })
            .notNull()
            .defaultTo('pending');
          collection.string('decidedById', { length: 64 }).nullable();
          collection.datetimeTz('decidedAt').nullable();
          collection.text('comment').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['issueId', 'status']);
          collection.index(['status', 'createdAt']);
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        name: 'pmIssueChecklistItems',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('statusKey', { length: 32 }).notNull();
          collection.string('itemKey', { length: 64 }).notNull();
          collection.string('label', { length: 200 }).notNull();
          collection.boolean('required').notNull().defaultTo(false);
          collection.integer('position').notNull().defaultTo(0);
          collection.string('checkedByType', { length: 32 }).nullable();
          collection.string('checkedById', { length: 64 }).nullable();
          collection.datetimeTz('checkedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['issueId', 'statusKey', 'itemKey']);
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },
});

export default migration;
