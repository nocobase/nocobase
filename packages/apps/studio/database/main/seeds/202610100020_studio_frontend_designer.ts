import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's built-in frontend designer (前端设计), which the "Software development" workflow template runs in UI review:
// it reviews the interface side of an approved proposal (interaction flow, components and design system, themes and
// dark mode, mobile widths, accessibility), writes no code and pushes nothing, and moves the issue on to development,
// back to analysis, or leaves it for the owner. It runs on Claude Code only, with an explicit model and a medium
// effort, and takes up to 3 runs at once; every run still counts against its runtime's own limit.
//
// A seed of its own rather than a change to `202610100010_studio_role_agents`, as each set of built-in agents is added:
// pending seeds run on an installed database too, so existing installations get it on their next start. Nothing is
// written without the agents plugin's collections or without the initial administrator to own it, and it has a fixed
// id and is written only when that id is missing: a replay adds nothing and an agent an administrator changed keeps
// its changes.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.
// The texts match the preset of `server/agents/catalog/presets.ts` as it was when this was written.

const ID = 'studio-frontend-designer';

/** Studio's translations: the application's namespace. */
const STUDIO_NAMESPACE = '@nocobase/i18n/application';

const INSTRUCTIONS = [
  "You are the team's frontend designer. You review the interface side of approved design proposals before development starts.",
  '',
  '- Read the issue, its comments, the proposal, and the pages and components it would change. Check the interaction flow; that it uses the existing components and design system consistently; the themes, dark mode included; narrow mobile widths; and accessibility: keyboard use, focus, labels and contrast.',
  '- Do not change code, push or open pull requests: your result is the review, as a comment on the issue, and the move your stage instruction names for your verdict.',
  '- Start the comment with your verdict, approve or changes requested, then list each finding with where it is, what is wrong and what to do instead. Leave out what is fine and matters of taste.',
  '- You act for the person who gave you the work and can do no more than they can. A refused command is an answer, not a problem to work around.',
  '- Write in the language the issue is written in.',
].join('\n');

const seed: SeedDefinition = defineSeed({
  name: '202610100020_studio_frontend_designer',
  transaction: true,
  async run(context) {
    const { query } = context;
    const repository = (name: string) => context.repository(name);
    // Without the agents plugin's collections there is nothing to seed. A missing Collection is reported before any SQL
    // runs, so probing leaves the transaction usable.
    try {
      await repository('agAgents').exists();
    } catch (error) {
      if (
        error instanceof Error &&
        Reflect.get(error, 'code') === 'COLLECTION_NOT_FOUND'
      )
        return;
      throw error;
    }
    const root = await query
      .selectFrom('authorizationPermissionSetAssignments')
      .select('subjectId')
      .where('permissionSetKey', '=', 'root')
      .where('subjectType', '=', 'user')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .executeTakeFirst();
    if (!root) return;
    const agents = repository('agAgents');
    if (await agents.exists({ filter: { id: ID } })) return;
    const now = new Date().toISOString();
    await agents.createOne({
      values: {
        id: ID,
        name: 'Frontend designer',
        description:
          'Reviews the interface side of approved proposals: interaction flow, components and design system, themes and dark mode, mobile widths and accessibility. Does not write code.',
        nameText: {
          key: 'studioAgents.presets.frontendDesigner.name',
          ns: STUDIO_NAMESPACE,
        },
        descriptionText: {
          key: 'studioAgents.presets.frontendDesigner.description',
          ns: STUDIO_NAMESPACE,
        },
        avatar: null,
        type: 'runner',
        modelEntries: [
          { tool: 'claude', model: 'claude-opus-5-5', effort: 'medium' },
        ],
        instructions: INSTRUCTIONS,
        runnerIds: [],
        // As the proposal reviewer: it reads and comments, and moves the issue on or back, which edits it.
        actions: [
          'pm.projects/view',
          'pm.issues/view',
          'pm.issues/comment',
          'pm.attachments/upload',
          'kb.knowledge/read',
          'pm.issues/edit',
        ],
        confirmChanges: 'larger',
        access: 'everyone',
        ownerUserId: String(root.subjectId),
        maxConcurrentRuns: 3,
        maxAttempts: 3,
        toolPolicy: null,
        lastClaimAt: null,
        archivedAt: null,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
    await repository('agAgentChanges').createOne({
      values: {
        id: `${ID}:created`,
        agentId: ID,
        revision: 1,
        action: 'created',
        // Null: the system made it, not a person.
        actorUserId: null,
        changes: [],
        createdAt: now,
      },
    });
  },
});

export default seed;
