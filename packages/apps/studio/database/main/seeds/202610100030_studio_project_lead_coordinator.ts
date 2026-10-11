import { defineSeed, type SeedDefinition } from '@nocobase/db';

// The project lead as a coordinator on a new installation. The migration `202610100030_studio_project_lead_coordinator`
// changes an installed one, but migrations run before seeds, so on a new installation the project lead does not exist
// yet when it runs: the older seed `202610010030_studio_builtin_agents` then writes it with its first configuration.
// This seed brings that one to the same configuration as the migration: explicit, lighter models, the coordinator's
// instructions and description, and no pull request or preview actions. It changes the project lead only while it is
// still as that seed wrote it (revision 1), so on an installed database, where the migration already changed it, and
// for one an administrator edited, it does nothing; a replay does nothing either. No issue executes the project lead on
// a new installation, so none is moved here.
//
// Self-contained on purpose: nothing is imported from server/ or shared/, and the texts are those of the migration.

const LEAD = 'studio-project-lead';

const REMOVED_ACTIONS = ['studio.git/open-pr', 'studio.previews/manage'];

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

const seed: SeedDefinition = defineSeed({
  name: '202610100030_studio_project_lead_coordinator',
  transaction: true,
  async run(context) {
    // `repository`, because `agAgents` holds JSON columns whose encoding differs by dialect.
    const agents = context.repository('agAgents');
    try {
      await agents.exists();
    } catch (error) {
      if (
        error instanceof Error &&
        Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
      )
        return;
      throw error;
    }
    const lead = (await agents.findOne({ filter: { id: LEAD } })) as {
      readonly actions?: unknown;
      readonly revision?: unknown;
    } | null;
    if (!lead || Number(lead.revision) !== 1) return;
    const actions = Array.isArray(lead.actions)
      ? lead.actions.filter(
          (action): action is string =>
            typeof action === 'string' && !REMOVED_ACTIONS.includes(action),
        )
      : [];
    const now = new Date().toISOString();
    await agents.updateOne({
      filter: { id: LEAD },
      values: {
        modelEntries: [
          { tool: 'claude', model: 'claude-sonnet-5', effort: 'medium' },
          { tool: 'codex', model: 'gpt-6-luna', effort: 'medium' },
        ],
        actions,
        instructions: INSTRUCTIONS,
        description:
          'Plans the work, splits issues into deliverable parts, coordinates who does them and answers questions; hands development to the developers and complex designs to the Solution designer.',
        revision: 2,
        updatedAt: now,
      },
    });
    await context.repository('agAgentChanges').createOne({
      values: {
        id: `${LEAD}:coordinator`,
        agentId: LEAD,
        revision: 2,
        action: 'updated',
        // Null: the system made it, not a person.
        actorUserId: null,
        changes: [
          { field: 'modelEntries' },
          { field: 'actions' },
          { field: 'instructions' },
          { field: 'description' },
        ],
        createdAt: now,
      },
    });
  },
});

export default seed;
