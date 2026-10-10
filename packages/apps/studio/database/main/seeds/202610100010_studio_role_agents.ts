import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's built-in role agents, which the "Software development" workflow template hands its stages to:
//
// - Solution designer (方案设计): analyses an issue and writes the design proposal; writes no code.
// - Proposal reviewer (方案评审): reviews the proposal and passes an approved one on to UI review or development; writes
//   no code, pushes nothing.
// - Senior developer (高级开发): changes that need design judgement, through to a pull request.
// - Developer (普通开发): small changes with clear bounds, through to a pull request.
// - Code reviewer (代码评审): reviews the pull request of an issue handed over for review; writes no code.
//
// Each lists its tools in order of preference, every entry with an explicit model and a medium effort, so a run never
// falls back to a tool's default model; a runtime takes the first entry whose tool it has. A reviewer's first model is
// not its author's, so no model reviews its own work: the proposal reviewer starts on Codex where the designer starts
// on Claude Code, and the code reviewer on Codex where the developers do. The two developers differ by model, not only
// by name. Reviewers and the designer take up to 3 runs at once, the developers 5; every run still counts against its
// runtime's own limit.
//
// A new seed rather than a change to `202610010030_studio_builtin_agents`: pending seeds run on an installed database
// too, so existing installations get the agents on their next start, and the project lead stays as it is. Like that
// seed, nothing is written without the agents plugin's collections or without the initial administrator to own the
// agents, and each agent has a fixed id and is written only when that id is missing: a replay adds nothing and an
// agent an administrator changed keeps its changes.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.
// The texts match the presets of `server/agents/catalog/presets.ts` as they were when this was written.

interface RoleAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** The key under `studioAgents.presets` of its translated name and description. */
  readonly preset: string;
  readonly modelEntries: readonly Record<string, unknown>[];
  readonly maxConcurrentRuns: number;
  readonly instructions: string;
  readonly actions: readonly string[];
}

/** Studio's translations: the application's namespace. */
const STUDIO_NAMESPACE = '@nocobase/i18n/application';

const entry = (tool: string, model: string) => ({
  tool,
  model,
  effort: 'medium',
});

const VERDICT_RULES = [
  '- Start the comment with your verdict, approve or changes requested, then list each finding with where it is, what is wrong and what to do instead. Leave out what is fine and matters of taste.',
  '- You act for the person who gave you the work and can do no more than they can. A refused command is an answer, not a problem to work around.',
  '- Write in the language the issue is written in.',
];

const REVIEWER_RULES = [
  '- Do not change code, push, open pull requests or move the issue: your result is the review, as a comment on the issue.',
  ...VERDICT_RULES,
];

const DEVELOPER_RULES = [
  '- Start from the issue you were given: read it, its comments and its approved proposal, if any, and implement what was agreed. Never invent issues, people, dates or statuses.',
  "- Work on a branch of your own, follow the repository's conventions, add tests for what you change, run its checks, and open a pull request that says what changed and how you verified it.",
  '- Keep statuses current, and say in a comment what you did, what is left and what blocks you. When something essential is missing, ask one short question instead of guessing.',
  '- You act for the person who gave you the work and can do no more than they can. A refused command is an answer, not a problem to work around.',
  '- Write in the language the issue is written in.',
];

const REVIEWER_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/comment',
  'pm.attachments/upload',
  'kb.knowledge/read',
];

const DEVELOPER_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/create',
  'pm.issues/edit',
  'pm.issues/comment',
  'pm.attachments/upload',
  'kb.knowledge/read',
  'kb.knowledge/propose',
  'studio.git/open-pr',
  'studio.previews/manage',
];

const ROLE_AGENTS: readonly RoleAgent[] = [
  {
    id: 'studio-solution-designer',
    name: 'Solution designer',
    description:
      'Analyses issues and writes the design proposal, recommending which developer should build it. Does not write code.',
    preset: 'solutionDesigner',
    modelEntries: [
      entry('claude', 'claude-opus-5-5'),
      entry('codex', 'gpt-6.1-sol'),
    ],
    maxConcurrentRuns: 3,
    instructions: [
      "You are the team's solution designer. You analyse issues and write design proposals that a person approves before anyone builds them.",
      '',
      '- Read the issue, its comments, its parent and sub-issues, the knowledge it points to and the code before you propose anything. Never invent issues, people, dates or statuses.',
      '- Do not change code, push or open pull requests: your result is the proposal.',
      '- Keep the proposal in proportion to the issue, and write only what the owner has to decide: what changes, why, the trade-offs, how it will be verified, and any split into sub-issues.',
      '- End the proposal with the developer you recommend, Senior developer or Developer, and why: Senior developer for cross-package, migration, security-related or design-heavy work, Developer for a small change with clear bounds.',
      '- When something essential is missing, ask one short question instead of guessing.',
      '- You act for the person who gave you the work and can do no more than they can. A refused command is an answer, not a problem to work around.',
      '- Write in the language the issue is written in.',
    ].join('\n'),
    actions: [
      'pm.projects/view',
      'pm.issues/view',
      'pm.issues/edit',
      'pm.issues/comment',
      'pm.attachments/upload',
      'kb.knowledge/read',
      'kb.knowledge/propose',
    ],
  },
  {
    id: 'studio-proposal-reviewer',
    name: 'Proposal reviewer',
    description:
      'Reviews design proposals, comments its findings, and passes approved ones on to UI review or development. Does not write code.',
    preset: 'proposalReviewer',
    modelEntries: [
      entry('codex', 'gpt-6-astra'),
      entry('claude', 'claude-fable-5-1'),
    ],
    maxConcurrentRuns: 3,
    instructions: [
      "You are the team's proposal reviewer. You review design proposals and pass the approved ones on to UI review or development.",
      '',
      '- Read the issue, its comments, the proposal and the code it would change. Check that the proposal solves what the issue asks, fits the existing design, names its risks and says how it will be verified, and that the recommended developer fits the work.',
      '- Do not change code, push or open pull requests: your result is the review, as a comment on the issue, and the move your stage instruction names for your verdict.',
      ...VERDICT_RULES,
    ].join('\n'),
    // Passing a proposal on moves the issue, which edits it.
    actions: [...REVIEWER_ACTIONS, 'pm.issues/edit'],
  },
  {
    id: 'studio-senior-developer',
    name: 'Senior developer',
    description:
      'Builds changes that need design judgement: across modules, migrations and security-related work, through to a pull request.',
    preset: 'seniorDeveloper',
    modelEntries: [
      entry('claude', 'claude-opus-5-5'),
      entry('codex', 'gpt-6.1-sol'),
    ],
    maxConcurrentRuns: 5,
    instructions: [
      "You are one of the team's senior developers. You take the changes that need design judgement: across modules or packages, migrations, security-related work.",
      '',
      ...DEVELOPER_RULES,
    ].join('\n'),
    actions: DEVELOPER_ACTIONS,
  },
  {
    id: 'studio-developer',
    name: 'Developer',
    description:
      'Builds small changes with clear bounds, such as fixes, UI touch-ups and added tests, through to a pull request.',
    preset: 'developer',
    modelEntries: [
      entry('claude', 'claude-sonnet-5'),
      entry('codex', 'gpt-6-luna'),
    ],
    maxConcurrentRuns: 5,
    instructions: [
      "You are one of the team's developers. You take small changes with clear bounds: fixes, UI touch-ups, added tests.",
      '',
      '- When the change turns out larger than its issue says (across packages, a migration, a security question), stop and say so in a comment instead of growing it.',
      ...DEVELOPER_RULES,
    ].join('\n'),
    actions: DEVELOPER_ACTIONS,
  },
  {
    id: 'studio-code-reviewer',
    name: 'Code reviewer',
    description:
      'Reviews the pull requests of issues handed over for review, and comments its findings. Does not write code.',
    preset: 'codeReviewer',
    modelEntries: [
      entry('codex', 'gpt-6-astra'),
      entry('claude', 'claude-opus-5-5'),
    ],
    maxConcurrentRuns: 3,
    instructions: [
      "You are the team's code reviewer. You review the pull requests of issues handed over for review.",
      '',
      "- Read the issue, its approved proposal if it has one, and the pull request's diff and checks. Look for bugs, missing tests, departures from the proposal and from the repository's conventions, and security problems; run the checks yourself when that settles a finding.",
      ...REVIEWER_RULES,
    ].join('\n'),
    actions: REVIEWER_ACTIONS,
  },
];

const seed: SeedDefinition = defineSeed({
  name: '202610100010_studio_role_agents',
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
    const ownerUserId = String(root.subjectId);
    const agents = repository('agAgents');
    const changes = repository('agAgentChanges');
    for (const agent of ROLE_AGENTS) {
      if (await agents.exists({ filter: { id: agent.id } })) continue;
      const now = new Date().toISOString();
      await agents.createOne({
        values: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          nameText: {
            key: `studioAgents.presets.${agent.preset}.name`,
            ns: STUDIO_NAMESPACE,
          },
          descriptionText: {
            key: `studioAgents.presets.${agent.preset}.description`,
            ns: STUDIO_NAMESPACE,
          },
          avatar: null,
          type: 'runner',
          modelEntries: agent.modelEntries,
          instructions: agent.instructions,
          runnerIds: [],
          actions: agent.actions,
          confirmChanges: 'larger',
          access: 'everyone',
          ownerUserId,
          maxConcurrentRuns: agent.maxConcurrentRuns,
          maxAttempts: 3,
          toolPolicy: null,
          lastClaimAt: null,
          archivedAt: null,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        },
      });
      await changes.createOne({
        values: {
          id: `${agent.id}:created`,
          agentId: agent.id,
          revision: 1,
          action: 'created',
          // Null: the system made it, not a person.
          actorUserId: null,
          changes: [],
          createdAt: now,
        },
      });
    }
  },
});

export default seed;
