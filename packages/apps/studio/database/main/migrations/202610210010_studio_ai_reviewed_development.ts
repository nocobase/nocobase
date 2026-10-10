import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Frozen install data: do not import evolving workflow templates into migration history.
const AI = {
  name: 'AI-reviewed development',
  description:
    'Agents review both the design and the code, and the owner is asked only for decisions a person has to make. In Analysis the solution designer writes a proposal; the proposal reviewer reviews it, and the frontend designer also reviews any UI changes; once approved, a developer agent implements it and opens a pull request; the code reviewer posts a final report, and the owner merges after reading it. The issue moves to Done when its pull requests are merged. Suits most development work.',
  definition: {
    states: [
      {
        key: 'backlog',
        name: 'Backlog',
        category: 'unstarted',
        color: 'gray',
        builtIn: true,
        rules: [
          {
            type: 'startOption',
            config: {
              label: {
                key: 'studioAgents.templateStarts.backlogLabel',
                ns: '@nocobase/i18n/application',
                defaultValue: 'Plan later',
              },
              hint: {
                key: 'studioAgents.templateStarts.backlogHint',
                ns: '@nocobase/i18n/application',
                defaultValue:
                  'The issue waits in Backlog. Nothing starts until it leaves Backlog.',
              },
            },
          },
        ],
      },
      {
        key: 'todo',
        name: 'Todo',
        category: 'unstarted',
        color: 'blue',
        builtIn: true,
        rules: [
          {
            type: 'startOption',
            config: {
              label: {
                key: 'studioAgents.templateStarts.developLabel',
                ns: '@nocobase/i18n/application',
                defaultValue: 'Straight to development',
              },
              hint: {
                key: 'studioAgents.templateStarts.developHint',
                ns: '@nocobase/i18n/application',
                defaultValue:
                  'For a small change with clear bounds: the agent implements it right away.',
              },
            },
          },
        ],
      },
      {
        key: 'analysis',
        name: 'Analysis',
        category: 'started',
        color: 'orange',
        builtIn: true,
        rules: [
          {
            type: 'startOption',
            config: {
              label: {
                key: 'studioAgents.templateStarts.aiDesignLabel',
                ns: '@nocobase/i18n/application',
                defaultValue: 'Design first',
              },
              hint: {
                key: 'studioAgents.templateStarts.aiDesignHint',
                ns: '@nocobase/i18n/application',
                defaultValue:
                  'The agent analyses and submits a design proposal; development starts once the agents approve it.',
              },
            },
          },
          {
            type: 'runAgent',
            config: {
              agentId: 'studio-solution-designer',
              assign: false,
              instruction:
                '{{issue.identifier}} ({{issue.title}}) uses the design-first process: analyse it first, propose a design, and submit it for agent review.\nRead the issue, its comments and the code; change nothing yet. Before the proposal is approved, do not change code, push, open a pull request or create sub-issues: describe any split into sub-issues in the proposal.\nKeep the proposal in proportion to the issue: for a small change, a few bullet points are enough. Do not restate what the issue already says.\nExplain the design decisions the reviewers need to assess: what changes, why, the trade-offs and how it will be verified. Leave out any part with nothing to say, and do not paste large blocks of code.\nWrite the proposal in the language of the issue, headings included.\nSubmit it with `nb-studio issue design-proposal {{issue.identifier}} --content-file proposal.md`; that moves the issue to proposal_review, where it is reviewed and passed on, or {{owner.name}} sends it back. The proposal is your report: end your turn without a comment restating or summarising it.\nIf the proposal was sent back (the issue returned to analysis with review comments), revise the whole proposal from those comments and submit it again as a complete document, not a diff.\nQuestions about the proposal arrive as comments: answer them in their thread.\nIf you cannot go on, comment what you need from {{owner.name}} and move the issue to blocked with `nb-studio issue update {{issue.identifier}} --status blocked`.',
            },
          },
        ],
      },
      {
        key: 'proposal_review',
        name: 'Proposal review',
        category: 'started',
        color: 'purple',
        builtIn: true,
        rules: [
          {
            type: 'runAgent',
            config: {
              agentId: 'studio-proposal-reviewer',
              assign: false,
              instruction:
                '{{issue.identifier}} ({{issue.title}}) has a design proposal in review. Review it, then pass it on or send it back; {{owner.name}} may still decide it themselves.\nRead the issue, its comments, the latest design proposal and the code it would change. Do not edit code, push or open a pull request.\nCheck that the proposal solves what the issue asks, fits the existing design, names its risks and says how it will be verified, and that the developer it recommends fits the work.\nComment your review with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue: start with your verdict, approve or changes requested, then each finding with what is wrong and what to do instead.\nIf you approve it and the proposal changes the interface (pages, components, styles, copy people see), move the issue to UI review with `nb-studio issue update {{issue.identifier}} --status ui_review`; if you approve it and it changes no interface, move it to development with `nb-studio issue update {{issue.identifier}} --status in_progress`. If you request changes, name each change to make in your comment and move the issue back to analysis with `nb-studio issue update {{issue.identifier}} --status analysis`, where the proposal is revised from your comment. Then end your turn.\nIf it needs a decision only a person can make, leave it in proposal review and mention {{owner.name}} in your comment (`[@{{owner.name}}](mention://user/<id>)`, with the owner’s id from `nb-studio issue get {{issue.identifier}} --json`).\nIf you cannot review it, comment what is missing and end your turn.',
            },
          },
        ],
      },
      {
        key: 'ui_review',
        name: '前端评审',
        category: 'started',
        color: 'purple',
        rules: [
          {
            type: 'runAgent',
            config: {
              agentId: 'studio-frontend-designer',
              assign: false,
              instruction:
                '{{issue.identifier}} ({{issue.title}}) has an approved design proposal that changes the interface. Review its interface side before development starts.\nRead the issue, its comments, the latest design proposal, and the pages and components it would change. Do not edit code, push or open a pull request.\nCheck the interaction flow; that it uses the existing components and design system consistently; the themes, dark mode included; narrow mobile widths; and accessibility: keyboard use, focus, labels and contrast.\nComment your review with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue: start with your verdict, approve or changes requested, then each finding with where it is, what is wrong and what to do instead.\nIf you approve it, move the issue to development with `nb-studio issue update {{issue.identifier}} --status in_progress`. If it needs changes, move it back to analysis with `nb-studio issue update {{issue.identifier}} --status analysis`, where the proposal is revised from your comment. If it needs a decision only a person can make, leave the issue where it is and mention {{owner.name}} in your comment (`[@{{owner.name}}](mention://user/<id>)`, with the owner’s id from `nb-studio issue get {{issue.identifier}} --json`). Then end your turn.\nIf you cannot review it, comment what is missing and end your turn.',
            },
          },
        ],
      },
      {
        key: 'in_progress',
        name: 'In progress',
        category: 'started',
        color: 'yellow',
        builtIn: true,
        rules: [
          {
            type: 'runAgent',
            config: {
              instruction:
                'Work on {{issue.identifier}} ({{issue.title}}) until the change is ready for review.\nComing from proposal_review or ui_review, the design proposal in its comments is approved: implement it as proposed, and create the sub-issues it describes, if any.\nComing back from in_review, address every review finding, push to the same branch and pull request, and report what changed before returning the issue to in_review.\nWork on your run’s branch (the branch your checkout is on), push it, and open the pull request with `nb-studio pr open --title "<title following the repository’s commit convention>" --body-file <path>`: Studio opens it and links it to the issue, so the title and body need no issue key. Do not open it with gh or another tool.\nWhen it is ready, comment what you did and move the issue to in_review with `nb-studio issue update {{issue.identifier}} --status in_review`; it moves to done once its pull requests are merged.\nIf you cannot go on, comment what you need from {{owner.name}} and move the issue to blocked with `nb-studio issue update {{issue.identifier}} --status blocked`.',
              defaultAgentId: 'studio-senior-developer',
            },
          },
        ],
      },
      {
        key: 'in_review',
        name: 'In review',
        category: 'started',
        color: 'purple',
        builtIn: true,
        rules: [
          {
            type: 'runAgent',
            config: {
              agentId: 'studio-code-reviewer',
              assign: false,
              instruction:
                '{{issue.identifier}} ({{issue.title}}) is handed over for review. Review its pull requests before {{owner.name}} merges them.\nList them with `nb-studio pr list`, then read the issue, its approved design proposal if it has one, and each pull request’s diff and checks. Do not edit code, push, open a pull request, merge or deploy.\nLook for bugs, missing tests, departures from the proposal and from the repository’s conventions, and security problems; run the checks yourself when that settles a finding.\nPost one final report with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue. Include your conclusion (approve or changes requested), key changes, verification results, review findings with what to change, remaining issues, and merge and deployment notes. Mention {{owner.name}} in that report so they can read it and merge (`[@{{owner.name}}](mention://user/<id>)`, with the owner’s id from `nb-studio issue get {{issue.identifier}} --json`).\nIf changes are required, list them and move the issue back to development with `nb-studio issue update {{issue.identifier}} --status in_progress`. Otherwise leave it in code review for the owner to merge. Never merge or deploy it yourself.\nThen end your turn without posting another review or summary.\nIf you cannot review it, comment what is missing and end your turn.',
            },
          },
        ],
      },
      {
        key: 'blocked',
        name: 'Blocked',
        category: 'started',
        color: 'red',
        builtIn: true,
      },
      {
        key: 'done',
        name: 'Done',
        category: 'done',
        color: 'green',
        builtIn: true,
      },
      {
        key: 'cancelled',
        name: 'Cancelled',
        category: 'closed',
        color: 'gray',
        builtIn: true,
      },
    ],
    transitions: [
      {
        from: '*',
        to: '*',
        actors: ['user'],
      },
      {
        from: 'todo',
        to: 'in_progress',
        actors: ['agent'],
      },
      {
        from: 'blocked',
        to: 'in_progress',
        actors: ['agent'],
      },
      {
        from: 'in_progress',
        to: 'in_review',
        actors: ['agent'],
      },
      {
        from: 'in_progress',
        to: 'blocked',
        actors: ['agent'],
      },
      {
        from: 'in_review',
        to: 'in_progress',
        actors: ['agent'],
      },
      {
        from: 'in_review',
        to: 'done',
        actors: ['system'],
        on: 'studio.merged',
      },
      {
        from: 'in_progress',
        to: 'done',
        actors: ['system'],
        on: 'studio.merged',
      },
      {
        from: 'todo',
        to: 'analysis',
        actors: ['agent', 'user'],
      },
      {
        from: 'analysis',
        to: 'proposal_review',
        actors: ['agent', 'user'],
      },
      {
        from: 'proposal_review',
        to: 'analysis',
        actors: ['agent', 'user'],
      },
      {
        from: 'proposal_review',
        to: 'in_progress',
        actors: ['agent', 'user'],
      },
      {
        from: 'proposal_review',
        to: 'ui_review',
        actors: ['agent', 'user'],
      },
      {
        from: 'ui_review',
        to: 'in_progress',
        actors: ['agent', 'user'],
      },
      {
        from: 'ui_review',
        to: 'analysis',
        actors: ['agent', 'user'],
      },
      {
        from: 'ui_review',
        to: 'blocked',
        actors: ['agent', 'user'],
      },
      {
        from: 'analysis',
        to: 'blocked',
        actors: ['agent', 'user'],
      },
      {
        from: 'proposal_review',
        to: 'blocked',
        actors: ['agent', 'user'],
      },
      {
        from: 'blocked',
        to: 'analysis',
        actors: ['agent'],
      },
    ],
  },
};
const OWNER_DESCRIPTION =
  'The owner approves every design before development starts. In Analysis an agent writes a proposal, and the owner approves it or sends it back in Proposal review; the executor then implements it and opens a pull request; In review notifies the owner to review and merge, and an AI code review can be added. Suits work with a wide impact, where a person should decide the direction.';
const FALLBACK = {
  states: [
    {
      key: 'backlog',
      name: 'Backlog',
      category: 'unstarted',
      color: 'gray',
      builtIn: true,
    },
    {
      key: 'todo',
      name: 'Todo',
      category: 'unstarted',
      color: 'blue',
      builtIn: true,
    },
    {
      key: 'analysis',
      name: 'Analysis',
      category: 'started',
      color: 'orange',
      builtIn: true,
    },
    {
      key: 'proposal_review',
      name: 'Proposal review',
      category: 'started',
      color: 'purple',
      builtIn: true,
    },
    {
      key: 'in_progress',
      name: 'In progress',
      category: 'started',
      color: 'yellow',
      builtIn: true,
    },
    {
      key: 'in_review',
      name: 'In review',
      category: 'started',
      color: 'purple',
      builtIn: true,
    },
    {
      key: 'blocked',
      name: 'Blocked',
      category: 'started',
      color: 'red',
      builtIn: true,
    },
    {
      key: 'done',
      name: 'Done',
      category: 'done',
      color: 'green',
      builtIn: true,
    },
    {
      key: 'cancelled',
      name: 'Cancelled',
      category: 'closed',
      color: 'gray',
      builtIn: true,
    },
  ],
  transitions: [
    {
      from: '*',
      to: '*',
      actors: ['user'],
    },
  ],
};
const AI_ID = 'studio-ai-reviewed-development';
const AI_KEY = 'aiReviewedDevelopment';
const LEGACY_ID = 'studio-preserved-default-workflow';
const BACKUP = 'studioDevelopmentWorkflowBackup';
const parse = <T>(value: unknown): T =>
  (typeof value === 'string' ? JSON.parse(value) : value) as T;

const migration: MigrationDefinition = defineMigration({
  name: '202610210010_studio_ai_reviewed_development',
  async up({ builder, query }) {
    // The projects plugin owns both tables; an application without it has nothing to upgrade.
    if (
      !(await builder.hasCollection('pmWorkflows')) ||
      !(await builder.hasCollection('pmProjects'))
    )
      return;
    await builder.createCollection(BACKUP, (collection) => {
      collection.string('id', { length: 128 }).primary().notNull();
      collection.string('targetId', { length: 64 }).notNull();
      collection.string('kind', { length: 32 }).notNull();
      collection.json('payload').notNull();
    });
    const workflows = await query
      .selectFrom('pmWorkflows')
      .selectAll()
      .execute();
    for (const row of workflows) {
      await query
        .insertInto(BACKUP)
        .values({
          id: `workflow:${String(row.id)}`,
          targetId: row.id,
          kind: 'workflow',
          payload: JSON.stringify(row),
        })
        .execute();
    }
    const previousDefault = workflows.find((row) => Boolean(row.isDefault));
    const projects = await query
      .selectFrom('pmProjects')
      .select(['id', 'workflowId', 'updatedAt'])
      .where('workflowId', 'is', null)
      .execute();
    const now = new Date().toISOString();
    const taken = new Set(workflows.map((row) => String(row.name)));
    const availableName = (name: string) => {
      let candidate = name;
      for (let suffix = 2; taken.has(candidate); suffix++)
        candidate = name + ' (' + suffix + ')';
      taken.add(candidate);
      return candidate;
    };
    if (!previousDefault && projects.length > 0) {
      await query
        .insertInto('pmWorkflows')
        .values({
          id: LEGACY_ID,
          name: availableName('Preserved project workflow'),
          description:
            'Preserves the previous built-in statuses for existing projects.',
          definition: JSON.stringify(FALLBACK),
          isDefault: false,
          builtInKey: null,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
    // Null means follow the default: pin these projects before changing that default.
    for (const project of projects) {
      await query
        .insertInto(BACKUP)
        .values({
          id: `project:${String(project.id)}`,
          targetId: project.id,
          kind: 'project',
          payload: JSON.stringify(project),
        })
        .execute();
      await query
        .updateTable('pmProjects')
        .set({ workflowId: previousDefault?.id ?? LEGACY_ID, updatedAt: now })
        .where('id', '=', project.id)
        .execute();
    }
    for (const row of workflows) {
      const changes: Record<string, unknown> = {
        isDefault: false,
        revision: Number(row.revision) + 1,
        updatedAt: now,
      };
      if (row.builtInKey === 'software') {
        changes.name =
          row.name === 'Owner-approved development'
            ? row.name
            : availableName('Owner-approved development');
        changes.description = OWNER_DESCRIPTION;
      } else if (!row.builtInKey && row.name === 'AI 评审开发流程') {
        changes.description =
          (typeof row.description === 'string' ? row.description : '') +
          '\n\n可切换到内置「AI 评审开发」，也可以保留此流程。 You can switch to the built-in AI-reviewed development workflow or keep this workflow.';
      }
      await query
        .updateTable('pmWorkflows')
        .set(changes)
        .where('id', '=', row.id)
        .execute();
    }
    const existing = workflows.find((row) => row.builtInKey === AI_KEY);
    if (existing) {
      await query
        .updateTable('pmWorkflows')
        .set({ isDefault: true })
        .where('id', '=', existing.id)
        .execute();
    } else {
      await query
        .insertInto('pmWorkflows')
        .values({
          id: AI_ID,
          builtInKey: AI_KEY,
          name: availableName(AI.name),
          description: AI.description,
          definition: JSON.stringify(AI.definition),
          isDefault: true,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
  async down({ builder, query }) {
    if (!(await builder.hasCollection(BACKUP))) return;
    const rows = await query.selectFrom(BACKUP).selectAll().execute();
    for (const row of rows) {
      const value = parse<{
        workflowId: string | null;
        name: string;
        description: string | null;
        isDefault: boolean;
        revision: number;
        updatedAt: string;
      }>(row.payload);
      if (row.kind === 'project') {
        await query
          .updateTable('pmProjects')
          .set({ workflowId: value.workflowId, updatedAt: value.updatedAt })
          .where('id', '=', row.targetId)
          .execute();
      } else {
        await query
          .updateTable('pmWorkflows')
          .set({
            name: value.name,
            description: value.description,
            isDefault: Boolean(value.isDefault),
            revision: value.revision,
            updatedAt: value.updatedAt,
          })
          .where('id', '=', row.targetId)
          .execute();
      }
    }
    if (
      !rows.some((row) => row.kind === 'workflow' && row.targetId === AI_ID)
    ) {
      // A project created after the upgrade must not keep a dangling reference on rollback.
      await query
        .updateTable('pmProjects')
        .set({ workflowId: null })
        .where('workflowId', '=', AI_ID)
        .execute();
      await query.deleteFrom('pmWorkflows').where('id', '=', AI_ID).execute();
    }
    await query
      .updateTable('pmProjects')
      .set({ workflowId: null })
      .where('workflowId', '=', LEGACY_ID)
      .execute();
    await query.deleteFrom('pmWorkflows').where('id', '=', LEGACY_ID).execute();
    if (await builder.hasCollection('pmSettings')) {
      const settings = await query
        .selectFrom('pmSettings')
        .select(['id', 'values'])
        .where('id', '=', 'default')
        .executeTakeFirst();
      if (settings) {
        const values =
          parse<Record<string, unknown> | null>(settings.values) ?? {};
        if (Array.isArray(values.installedWorkflowTemplates))
          values.installedWorkflowTemplates =
            values.installedWorkflowTemplates.filter(
              (key: unknown) => key !== AI_KEY,
            );
        await query
          .updateTable('pmSettings')
          .set({ values: JSON.stringify(values) })
          .where('id', '=', settings.id)
          .execute();
      }
    }
    await builder.dropCollection(BACKUP);
  },
});
export default migration;
