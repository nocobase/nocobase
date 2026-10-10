import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's built-in agents, so a new installation has a team to give work to:
//
// - Project lead (项目主管): a runner agent that plans, splits and drives issues and writes code, on Claude Code and
//   then Codex, each with its default model and effort. It takes work once a runtime with either tool is connected.
// - Project assistant (项目助理): an online agent people talk to. It starts with no model of its own, so it answers with
//   the system default chat model (Agent team › Models), which the first chat model a model service turns on becomes:
//   it works as soon as any chat model exists, and someone may still give it models of its own (Agent team › Agents ›
//   Project assistant › Capabilities). It is the team's default chat agent (the
//   agents plugin's `agSettings` `chat`), unless one was chosen already, so chat answers fast once it has a model; people
//   pick the project lead in the chat panel when they want the runner agent.
//
// Their names and descriptions are written in English with i18n references to Studio's preset texts
// (`studioAgents.presets`), which the agent pages show in the viewer's language until someone edits the field. Their
// instructions are prompt text and stay English: the platform's rules are English too, and the agents reply in the
// language people write in.
//
// Nothing is seeded where the agents plugin's collections are missing. Both are owned by the installation's initial
// administrator (the `root` permission set's user, seeded earlier as
// `202608240001`) and usable by everyone. Without that user there is nobody to own them, and nothing is written.
// Each agent has a fixed id and is written only when that id is missing, so a replay adds nothing and an agent an
// administrator changed keeps its changes.
//
// The rows are written through `repository` because `agAgents` holds JSON columns (the entries, the actions) whose
// encoding differs by dialect; `query` would have to encode them by hand.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.
// The instructions match the presets of `server/agents/catalog/presets.ts` as they were when this was written.

interface BuiltIn {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** The key under `studioAgents.presets` of its translated name and description. */
  readonly preset: string;
  readonly type: 'runner' | 'online';
  readonly modelEntries: readonly Record<string, unknown>[];
  readonly instructions: string;
  readonly actions: readonly string[];
}

const ASSISTANT_ID = 'studio-project-assistant';

/** Studio's translations: the application's namespace. */
const STUDIO_NAMESPACE = '@nocobase/i18n/application';

const BUILT_INS: readonly BuiltIn[] = [
  {
    id: 'studio-project-lead',
    name: 'Project lead',
    description:
      'Plans the work, splits issues into deliverable parts and drives them to done, and writes code when that is quickest.',
    preset: 'projectLead',
    type: 'runner',
    modelEntries: [
      { tool: 'claude', model: null, effort: null },
      { tool: 'codex', model: null, effort: null },
    ],
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
    actions: [
      'pm.projects/view',
      'pm.issues/view',
      'pm.issues/create',
      'pm.issues/edit',
      'pm.issues/comment',
      'pm.issues/close',
      'pm.issues/change-owner',
      'pm.attachments/upload',
      'kb.knowledge/read',
      'kb.knowledge/propose',
      'studio.git/open-pr',
      'studio.previews/manage',
      'studio.reports/read',
    ],
  },
  {
    id: ASSISTANT_ID,
    name: 'Project assistant',
    description:
      'Answers questions about projects and issues, keeps the work organized, and turns requests into issues and plans for you to confirm.',
    preset: 'projectAssistant',
    type: 'online',
    modelEntries: [],
    instructions: [
      "You are the team's project assistant. People talk to you to learn where the work stands and to get it organized.",
      '',
      '- Look things up before you answer: read the projects, issues, owners and statuses with your commands, and name the issues you talk about by their keys. Never invent issues, people, dates or statuses; say what you could not find.',
      '- Lead with the answer, then the details. Keep replies short and use lists for several items.',
      '- Turn vague requests into concrete issues: a clear title, what done looks like, an owner, and the parent or project they belong to. When something essential is missing, ask one short question instead of guessing.',
      '- Make small, clear changes directly when your commands allow it. For anything larger (several issues at once, a new project, reassigning work, finishing or closing issues, giving work to agents), propose an operation plan and let the person confirm it. When a command answers that a plan is needed, make a plan.',
      '- You act for the person who talks to you and can do no more than they can. A refused command is an answer, not a problem to work around.',
      '- Reply in the language the person writes in.',
    ].join('\n'),
    actions: [
      'pm.projects/view',
      'pm.issues/view',
      'pm.issues/create',
      'pm.issues/edit',
      'pm.issues/comment',
      'kb.knowledge/read',
      'kb.knowledge/propose',
      'studio.reports/read',
    ],
  },
];

const seed: SeedDefinition = defineSeed({
  name: '202610010030_studio_builtin_agents',
  transaction: true,
  async run(context) {
    const { query } = context;
    const repository = (name: string) => context.repository(name);
    // Without the agents plugin's collections (a database built without its migrations) there is nothing to seed. A
    // missing Collection is reported before any SQL runs, so probing leaves the transaction usable.
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
    for (const agent of BUILT_INS) {
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
          type: agent.type,
          modelEntries: agent.modelEntries,
          instructions: agent.instructions,
          runnerIds: [],
          actions: agent.actions,
          confirmChanges: 'larger',
          access: 'everyone',
          ownerUserId,
          maxConcurrentRuns: 2,
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
    // The assistant is the team's default chat agent, unless someone chose one already.
    const settings = repository('agSettings');
    if (
      (await agents.exists({ filter: { id: ASSISTANT_ID } })) &&
      !(await settings.exists({ filter: { key: 'chat' } }))
    )
      await settings.createOne({
        values: {
          key: 'chat',
          value: { defaultAgentId: ASSISTANT_ID },
          updatedById: null,
          updatedAt: new Date().toISOString(),
        },
      });
  },
});

export default seed;
