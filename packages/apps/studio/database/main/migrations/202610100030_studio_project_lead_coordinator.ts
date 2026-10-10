import { createHash } from 'node:crypto';

import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The built-in project lead (`studio-project-lead`, seeded by `202610010030_studio_builtin_agents`) becomes a
// coordinator: it plans, splits, coordinates and answers questions, and hands development to the built-in developers
// and complex designs to the solution designer. On an installed database this migration
//
// - gives it explicit, lighter models (Claude Code `claude-sonnet-5`, then Codex `gpt-6-luna`, both with a medium
//   effort), its new instructions and description, and takes away the actions of building: opening pull requests
//   (`studio.git/open-pr`) and managing previews (`studio.previews/manage`); any other action it was given stays. This
//   overwrites the models, instructions and description an administrator may have changed;
// - makes the senior developer (`studio-senior-developer`) the executor of every issue the project lead executes that
//   is not finished: whose status is in no `done` or `closed` category of its workflow, deleted issues left alone;
// - withdraws the project lead's queued runs on those issues (cancelled, as withdrawing queued work does), so none of
//   them starts later as the project lead.
//
// Nothing is woken: the rows change directly, so no run starts, and a run of the project lead already claimed or
// running goes on to its end. The next time such an issue enters a stage of its executor's, the senior developer works
// on it. Each moved issue gets an `executor_changed` line in its activity, by the system, whose id is derived from the
// issue's (`MOVED_PREFIX` and a digest, within the 64 characters an id holds) so `down` can remove them. The senior developer is created by the role agents seed,
// which runs after the migrations and writes it wherever there is an initial administrator, the same condition under
// which the project lead was seeded; so nothing is moved unless the project lead exists.
//
// A new installation creates the project lead after the migrations, with the seed's older configuration: the seed
// `202610100030_studio_project_lead_coordinator` brings it to the same configuration there.
//
// `down` restores the project lead's previous configuration and removes the activity lines. Issues stay with the senior
// developer, and withdrawn runs stay withdrawn: which issues the project lead executed is not kept.
//
// Self-contained on purpose: nothing is imported from server/ or shared/, and the texts are as they were when this
// was written. JSON columns are written as JSON text, which every dialect's driver takes for a JSON column.

const LEAD = 'studio-project-lead';
const SENIOR_DEVELOPER = 'studio-senior-developer';

/** The ids of the activity lines this migration writes: the prefix and a digest of the issue's id, 57 characters. */
const MOVED_PREFIX = 'lead-coordinator:';
const movedActivityId = (issueId: string): string =>
  `${MOVED_PREFIX}${createHash('sha256').update(issueId).digest('hex').slice(0, 40)}`;

const WITHDRAWN_DETAIL =
  'Withdrawn when the project lead became a coordinator: the senior developer executes the issue now.';

const REMOVED_ACTIONS = ['studio.git/open-pr', 'studio.previews/manage'];

const MODEL_ENTRIES = [
  { tool: 'claude', model: 'claude-sonnet-5', effort: 'medium' },
  { tool: 'codex', model: 'gpt-6-luna', effort: 'medium' },
];

const DESCRIPTION =
  'Plans the work, splits issues into deliverable parts, coordinates who does them and answers questions; hands development to the developers and complex designs to the Solution designer.';

const INSTRUCTIONS = [
  "You are the team's project lead. You plan the work, break it into issues, coordinate who does what and answer questions about it; you do not write code yourself.",
  '',
  '- Start from the issue you were given: read it, its comments, its parent and sub-issues, and the knowledge it points to before you act. Never invent issues, people, dates or statuses.',
  '- Plan before anyone builds. When an issue is more than a day or two of work, split it into sub-issues that can each be delivered on their own, with a clear title, what done looks like and an owner, and say in a comment how they fit together.',
  '- Hand the building over: make the Senior developer the executor for work across modules, migrations or security-related work, the Developer for a small change with clear bounds, and move an issue that needs a real design to Analysis for the Solution designer.',
  '- Drive the work: keep statuses current, and say in a comment what you did, what is left and what blocks you. When something essential is missing, ask one short question instead of guessing.',
  '- You act for the person who gave you the work and can do no more than they can. A refused command is an answer, not a problem to work around.',
  '- Write in the language the issue is written in.',
].join('\n');

/** The seeded configuration `down` restores. */
const PREVIOUS = {
  modelEntries: [
    { tool: 'claude', model: null, effort: null },
    { tool: 'codex', model: null, effort: null },
  ],
  description:
    'Plans the work, splits issues into deliverable parts and drives them to done, and writes code when that is quickest.',
  instructions: [
    "You are the team's project lead. You plan the work, break it into issues and drive it to done, and you write code yourself when that is the quickest way forward.",
    '',
    '- Start from the issue you were given: read it, its comments, its parent and sub-issues, and the knowledge it points to before you act. Never invent issues, people, dates or statuses.',
    '- Plan before you build. When an issue is more than a day or two of work, split it into sub-issues that can each be delivered on their own, with a clear title, what done looks like and an owner, and say in a comment how they fit together.',
    '- Drive the work: keep statuses current, and say in a comment what you did, what is left and what blocks you. When something essential is missing, ask one short question instead of guessing.',
    "- When you write code, work on a branch of your own, follow the repository's conventions, run its checks, and open a pull request that says what changed and how you verified it.",
    '- You act for the person who gave you the work and can do no more than they can. A refused command is an answer, not a problem to work around.',
    '- Write in the language the issue is written in.',
  ].join('\n'),
};

/** The categories of the statuses no work remains in. */
const FINISHED_CATEGORIES = new Set(['done', 'closed']);

/** The finished statuses of a workflow with none: the projects plugin's built-in ones. */
const BUILT_IN_FINISHED = new Set(['done', 'cancelled']);

const parseJson = (value: unknown): unknown =>
  typeof value === 'string' ? JSON.parse(value) : value;

const stringList = (value: unknown): string[] => {
  const parsed = parseJson(value ?? []);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === 'string')
    : [];
};

/** The keys of a workflow definition's finished statuses. */
function finishedStatuses(definition: unknown): Set<string> {
  const parsed = parseJson(definition) as { states?: unknown } | null;
  const states = Array.isArray(parsed?.states) ? parsed.states : [];
  const keys = new Set<string>();
  for (const state of states as { key?: unknown; category?: unknown }[])
    if (
      typeof state?.key === 'string' &&
      typeof state.category === 'string' &&
      FINISHED_CATEGORIES.has(state.category)
    )
      keys.add(state.key);
  return keys;
}

const migration: MigrationDefinition = defineMigration({
  name: '202610100030_studio_project_lead_coordinator',

  async up({ builder, query }) {
    // No agents table, or no project lead: there is nothing to change.
    if (!(await builder.hasCollection('agAgents'))) return;
    const lead = await query
      .selectFrom('agAgents')
      .select(['id', 'actions', 'revision'])
      .where('id', '=', LEAD)
      .executeTakeFirst();
    if (!lead) return;
    const now = new Date().toISOString();
    const revision = Number(lead.revision ?? 1) + 1;
    await query
      .updateTable('agAgents')
      .set({
        modelEntries: JSON.stringify(MODEL_ENTRIES),
        actions: JSON.stringify(
          stringList(lead.actions).filter(
            (action) => !REMOVED_ACTIONS.includes(action),
          ),
        ),
        instructions: INSTRUCTIONS,
        description: DESCRIPTION,
        revision,
        updatedAt: now,
      })
      .where('id', '=', LEAD)
      .execute();
    if (await builder.hasCollection('agAgentChanges'))
      await query
        .insertInto('agAgentChanges')
        .values({
          id: `${LEAD}:coordinator`,
          agentId: LEAD,
          revision,
          action: 'updated',
          // Null: the system made it, not a person.
          actorUserId: null,
          changes: JSON.stringify([
            { field: 'modelEntries' },
            { field: 'actions' },
            { field: 'instructions' },
            { field: 'description' },
          ]),
          createdAt: now,
        })
        .execute();

    if (!(await builder.hasCollection('pmIssues'))) return;
    const issues = await query
      .selectFrom('pmIssues')
      .select(['id', 'statusKey', 'projectId', 'revision'])
      .where('executorType', '=', 'agent')
      .where('executorId', '=', LEAD)
      .where('deletedAt', 'is', null)
      .execute();
    if (issues.length === 0) return;
    // Which statuses are finished, by the workflow each issue follows: its project's, else the default one, else the
    // built-in statuses.
    const workflows = (await builder.hasCollection('pmWorkflows'))
      ? await query
          .selectFrom('pmWorkflows')
          .select(['id', 'isDefault', 'definition'])
          .execute()
      : [];
    const finishedBy = new Map(
      workflows.map((row) => [
        String(row.id),
        finishedStatuses(row.definition),
      ]),
    );
    const defaultWorkflow = workflows.find((row) => Boolean(row.isDefault));
    const fallback =
      (defaultWorkflow
        ? finishedBy.get(String(defaultWorkflow.id))
        : undefined) ?? BUILT_IN_FINISHED;
    const projectIds = [
      ...new Set(
        issues
          .map((issue) => issue.projectId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];
    const projects =
      projectIds.length > 0 && (await builder.hasCollection('pmProjects'))
        ? await query
            .selectFrom('pmProjects')
            .select(['id', 'workflowId'])
            .where('id', 'in', projectIds)
            .execute()
        : [];
    const workflowOf = new Map(
      projects.map((row) => [String(row.id), row.workflowId as string | null]),
    );
    const activities = await builder.hasCollection('pmActivities');
    const runs = await builder.hasCollection('agRuns');
    for (const issue of issues) {
      const workflowId =
        typeof issue.projectId === 'string'
          ? workflowOf.get(issue.projectId)
          : null;
      const finished =
        (workflowId ? finishedBy.get(workflowId) : undefined) ?? fallback;
      if (finished.has(String(issue.statusKey))) continue;
      await query
        .updateTable('pmIssues')
        .set({
          executorId: SENIOR_DEVELOPER,
          revision: Number(issue.revision ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where('id', '=', issue.id)
        .execute();
      if (activities)
        await query
          .insertInto('pmActivities')
          .values({
            id: movedActivityId(String(issue.id)),
            issueId: issue.id,
            actorType: 'system',
            actorId: null,
            action: 'executor_changed',
            details: JSON.stringify({
              from: { type: 'agent', id: LEAD },
              to: { type: 'agent', id: SENIOR_DEVELOPER },
            }),
            createdAt: new Date(),
          })
          .execute();
      if (runs) {
        const now = new Date().toISOString();
        await query
          .updateTable('agRuns')
          .set({
            status: 'cancelled',
            failureReason: 'cancelled',
            failureDetail: WITHDRAWN_DETAIL,
            finishedAt: now,
            leaseExpiresAt: null,
            availableAt: null,
            updatedAt: now,
          })
          .where('agentId', '=', LEAD)
          .where('subjectKind', '=', 'issue')
          .where('subjectId', '=', issue.id)
          .where('status', '=', 'queued')
          .execute();
      }
    }
  },

  async down({ builder, query }) {
    if (!(await builder.hasCollection('agAgents'))) return;
    const lead = await query
      .selectFrom('agAgents')
      .select(['id', 'actions', 'revision'])
      .where('id', '=', LEAD)
      .executeTakeFirst();
    if (!lead) return;
    const actions = stringList(lead.actions);
    await query
      .updateTable('agAgents')
      .set({
        modelEntries: JSON.stringify(PREVIOUS.modelEntries),
        actions: JSON.stringify([
          ...actions,
          ...REMOVED_ACTIONS.filter((action) => !actions.includes(action)),
        ]),
        instructions: PREVIOUS.instructions,
        description: PREVIOUS.description,
        revision: Number(lead.revision ?? 1) + 1,
        updatedAt: new Date().toISOString(),
      })
      .where('id', '=', LEAD)
      .execute();
    if (await builder.hasCollection('agAgentChanges'))
      await query
        .deleteFrom('agAgentChanges')
        .where('id', '=', `${LEAD}:coordinator`)
        .execute();
    if (await builder.hasCollection('pmActivities'))
      await query
        .deleteFrom('pmActivities')
        .where('id', 'like', `${MOVED_PREFIX}%`)
        .execute();
  },
});

export default migration;
