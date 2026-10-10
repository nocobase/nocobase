/**
 * Builds Studio's demo data (`data.ts`) through the plugins' own services, as people using Studio would: accounts through
 * user management, labels, the review checklist, projects, issues and comments through the projects plugin, skills,
 * agents and runtimes through the agents plugin, knowledge through the knowledge plugin. The work items therefore carry
 * identifiers, activity and inbox notices like any other.
 *
 * The demo adds no workflow of its own: it adds its review checklist to In review of the installed Software development
 * workflow (`addReviewChecklist`, which leaves a workflow that has the items alone), and its projects use the default
 * workflow.
 *
 * Its past — issues finished over the last two months and the agents' runs on them — is written directly, dated back
 * (`history.ts`), so the dashboard has figures from the start.
 *
 * The administrator creates the structure; each comment is written by its author. Issues are created in a status a
 * workflow accepts on creation and then moved, so entering a status runs its rules (the review checklist). Its runtimes
 * register once and go offline, so agents get no runner and issues an agent executes are not started. The demo adds no
 * chat agent of its own: Studio's built-in project assistant becomes the team's default chat agent on the models a
 * model service offers (it answers on the server, without a runner); without one it keeps waiting for a model and the
 * demo logs how to give it one.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import {
  PROTOCOL_VERSION,
  RUNNER_FEATURES,
  type AgentTool,
} from '@nocobase/agent-protocol';
import { composeSkillMarkdown } from '@nocobase/app-plugin-agents/shared/skills';
import type { Knowledge } from '@nocobase/app-plugin-knowledge/server/tokens';
import type {
  Projects,
  ProjectsAccess,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  ChecklistItemDefinition,
  WorkflowStatusRule,
} from '@nocobase/app-plugin-projects/shared/workflows';
import type { Priority } from '@nocobase/app-plugin-projects/shared/common';
import type { Executor } from '@nocobase/app-plugin-projects/shared/issues';
import type { ProjectStatus } from '@nocobase/app-plugin-projects/shared/projects';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import { SOFTWARE_TEMPLATE_KEY } from '../agents/catalog/workflow-templates.js';
import { AGENT_KIND } from '../agents/tx.js';
import { DESIGN_PROPOSAL_KIND } from '../../shared/design.js';
import {
  DEMO_AGENTS,
  DEMO_ISSUES,
  DEMO_KNOWLEDGE,
  DEMO_KNOWLEDGE_PROPOSAL,
  DEMO_LABELS,
  DEMO_PASSWORD,
  DEMO_PROJECTS,
  DEMO_REVIEW_CHECKLIST,
  DEMO_RUNTIMES,
  DEMO_SKILLS,
  DEMO_USERS,
  type DemoIssue,
} from './data.js';
import { buildDemoHistory } from './history.js';

export interface DemoDependencies {
  readonly users: UserManagementService;
  readonly projects: Projects;
  readonly access: Pick<ProjectsAccess, 'permissionsOfUser'>;
  /** The agents plugin; without it no skills or agents are created. */
  readonly agents: Agents | null;
  /** The knowledge plugin's knowledge base; without it no documents are created. */
  readonly knowledge?: Knowledge | null;
  /** The initial administrator, who builds the structure. */
  readonly adminId: string;
  readonly now?: () => Date;
  readonly onWarning?: (message: string, error: unknown) => void;
  /** The database, for the demo's past (`history.ts`); without it the demo has no history to measure. */
  readonly connection?: () => DatabaseConnection;
}

/** What was created, by kind. */
export type DemoSummary = Record<string, number>;

/** Issues created directly in a status no workflow accepts on creation start here and are then moved. */
const CREATE_STATUS: Readonly<Record<string, string>> = {
  done: 'todo',
  cancelled: 'todo',
  in_review: 'in_progress',
  // Entering Analysis would run the agent; the proposal is written first, then the issue moves on (`proposal`).
  proposal_review: 'todo',
};

/** The status the demo's review checklist is on. */
const REVIEW_STATUS = 'in_review';

/** Studio's built-in online agent (`database/main/seeds/202610010030_studio_builtin_agents.ts`). */
const BUILT_IN_ASSISTANT = 'studio-project-assistant';

/**
 * The demo's chat agent is Studio's built-in project assistant: while it still has no model, it gets the first ones the
 * installation's model services offer (the first its default) and is made the team's default chat agent (which the
 * installation already made it, unless someone chose another). Without a model service it keeps waiting for one, and
 * the demo says how to give it one.
 */
async function configureAssistant(
  agents: Agents,
  adminId: string,
  warn: (message: string, error: unknown) => void,
  created: (what: string) => void,
): Promise<void> {
  const assistant = await agents.agents
    .get(BUILT_IN_ASSISTANT)
    .catch(() => null);
  if (!assistant || assistant.archivedAt || assistant.modelEntries.length > 0)
    return;
  const catalog = await agents.online.gateway.catalog();
  const models = catalog.services
    .flatMap((service) =>
      service.models.map((option) => ({
        modelService: service.name,
        model: option.value,
      })),
    )
    .slice(0, 3);
  if (models.length === 0) {
    warn(
      `The built-in ${assistant.name} has no model: set up a model service with a model in Agent team › Models, then give it one on its page to chat with it`,
      null,
    );
    return;
  }
  await agents.agents.update(assistant.id, adminId, {
    modelEntries: models,
    expectedRevision: assistant.revision,
  });
  await agents.chat.updateSettings(adminId, {
    defaultAgentId: assistant.id,
  });
  created('onlineAgents');
}

/**
 * Adds the demo's review checklist to In review of the Software development workflow (or of the default workflow
 * without it), through the workflow service as an administrator would. Items it has already are left as they are, so
 * running it again changes nothing. False when there is no such workflow.
 */
export async function addReviewChecklist(
  projects: Pick<Projects, 'workflows'>,
  admin: Viewer,
): Promise<boolean> {
  const rows = await projects.workflows.list(admin);
  const target =
    rows.find((row) => row.builtInKey === SOFTWARE_TEMPLATE_KEY) ??
    rows.find((row) => row.isDefault);
  if (!target) return false;
  const status = target.definition.states.find(
    (state) => state.key === REVIEW_STATUS,
  );
  if (!status) return false;
  const rules = status.rules ?? [];
  const existing = rules.find((rule) => rule.type === 'checklist');
  const config =
    existing && 'config' in existing
      ? (existing.config as {
          readonly items?: readonly ChecklistItemDefinition[];
        })
      : undefined;
  const items = config?.items ?? [];
  const missing = DEMO_REVIEW_CHECKLIST.filter(
    (item) => !items.some((have) => have.key === item.key),
  );
  if (missing.length === 0) return true;
  const checklist: WorkflowStatusRule = {
    type: 'checklist',
    config: { items: [...items, ...missing] },
  };
  await projects.workflows.update(admin, target.id, {
    revision: target.revision,
    definition: {
      ...target.definition,
      states: target.definition.states.map((state) =>
        state.key === REVIEW_STATUS
          ? {
              ...state,
              rules: [
                checklist,
                ...rules.filter((rule) => rule.type !== 'checklist'),
              ],
            }
          : state,
      ),
    },
  });
  return true;
}

export async function buildDemo(deps: DemoDependencies): Promise<DemoSummary> {
  const now = deps.now ?? (() => new Date());
  const today = now();
  const day = (offset: number): string =>
    new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() + offset,
      ),
    )
      .toISOString()
      .slice(0, 10);
  const summary: DemoSummary = {};
  const created = (kind: string) => {
    summary[kind] = (summary[kind] ?? 0) + 1;
  };
  const warn =
    deps.onWarning ??
    ((message: string, error: unknown) => console.warn(message, error));
  const { projects } = deps;

  const userIds = new Map<string, string>([['admin', deps.adminId]]);
  const names = new Map<string, string>();
  const viewers = new Map<string, Viewer>();
  async function viewerOf(key: string): Promise<Viewer> {
    const known = viewers.get(key);
    if (known) return known;
    const userId = userIds.get(key);
    if (!userId) throw new Error(`Unknown demo user ${key}`);
    await projects.members.ensure(userId);
    const viewer: Viewer = {
      userId,
      actor: { type: 'user', id: userId },
      permissions: await deps.access.permissionsOfUser!(userId),
    };
    viewers.set(key, viewer);
    return viewer;
  }
  const admin = await viewerOf('admin');
  names.set('admin', (await projects.members.me(admin)).name ?? 'admin');

  /** `@{key}` in text as a mention of that user. */
  const withMentions = (text: string): string =>
    text.replace(/@\{(\w+)\}/gu, (_, key: string) => {
      const id = userIds.get(key);
      return id ? `[@${names.get(key) ?? key}](mention://user/${id})` : key;
    });

  // People.
  for (const user of DEMO_USERS) {
    const account = await deps.users.create({
      name: user.name,
      username: user.key,
      email: user.email,
      password: DEMO_PASSWORD,
      roleScopes: { studio: [...user.roles] },
    });
    userIds.set(user.key, account.id);
    names.set(user.key, user.name);
    created('users');
    // A person becomes a member on their first request; the demo's people are members at once.
    await viewerOf(user.key);
  }

  // Labels.
  // A label the installation already has, such as a preset one, is reused rather than created again.
  const labels = new Map<string, string>(
    (await projects.labels.list()).map((label) => [label.name, label.id]),
  );
  for (const label of DEMO_LABELS) {
    if (labels.has(label.name)) continue;
    const row = await projects.labels.create(admin, {
      name: label.name,
      color: label.color as never,
    });
    labels.set(label.name, row.id);
    created('labels');
  }

  // The review checklist, on the installed Software development workflow every demo project uses.
  const reviewChecklist = await addReviewChecklist(projects, admin);
  if (!reviewChecklist)
    warn(
      'The demo review checklist was not added: there is no Software development or default workflow',
      null,
    );

  // Skills and agents.
  const skills = new Map<string, string>();
  const agents = new Map<string, string>();
  if (deps.agents) {
    for (const skill of DEMO_SKILLS) {
      const row = await deps.agents.skills.create(deps.adminId, {
        content: composeSkillMarkdown(
          { name: skill.name, description: skill.description },
          skill.content,
        ),
      });
      skills.set(skill.name, row.id);
      created('skills');
    }
    for (const agent of DEMO_AGENTS) {
      const row = await deps.agents.agents.create(deps.adminId, {
        name: agent.name,
        modelEntries: agent.tools.map((entry) => ({
          tool: entry.tool as AgentTool,
          model: entry.model ?? null,
        })),
        description: agent.description,
        instructions: agent.instructions,
        skillIds: agent.skills.flatMap((name) => skills.get(name) ?? []),
        actions: agent.actions,
        access: 'everyone',
        maxConcurrentRuns: 2,
      });
      agents.set(agent.name, row.id);
      created('agents');
    }
    await configureAssistant(deps.agents, deps.adminId, warn, created);

    // Runtimes: each registers once through a registration token its owner creates, as a runner does, and is never
    // heard from again; the sweeper marks it offline, so it shows on the Runtimes page and takes no work.
    for (const runtime of DEMO_RUNTIMES) {
      const ownerId = userIds.get(runtime.owner);
      if (!ownerId) throw new Error(`Unknown demo user ${runtime.owner}`);
      const token = await deps.agents.runners.createRegistrationToken(ownerId, {
        trust: runtime.trust,
        slots: runtime.slots,
        toolSlots: runtime.toolSlots ?? null,
      });
      const registered = await deps.agents.runners.register({
        registrationToken: token.token,
        name: runtime.name,
        hostname: runtime.hostname,
        os: runtime.os,
        arch: runtime.arch,
        version: '0.1.0',
        protocolVersion: PROTOCOL_VERSION,
        features: [...RUNNER_FEATURES],
        tools: runtime.tools.map((kind) => ({ kind, authenticated: true })),
      });
      if (runtime.acceptJobs)
        await deps.agents.runners.update(registered.runnerId, {
          acceptJobs: true,
        });
      created('runtimes');
    }
  }

  // Projects, their members and skills.
  const projectIds = new Map<string, string>();
  for (const project of DEMO_PROJECTS) {
    const row = await projects.projects.create(admin, {
      name: project.name,
      description: project.description,
      visibility: project.visibility,
      status: project.status as ProjectStatus,
      priority: project.priority as Priority,
      leadUserId: userIds.get(project.lead) ?? null,
      startDate: day(project.start),
      dueDate: day(project.due),
      workflowId: null,
    });
    projectIds.set(project.name, row.id);
    created('projects');
    const members = new Set(row.members.map((member) => member.id));
    for (const key of project.members) {
      const userId = userIds.get(key);
      if (!userId || members.has(userId)) continue;
      await projects.projects.addMember(admin, row.id, { userId });
      members.add(userId);
    }
    const attached = (project.skills ?? []).flatMap(
      (name) => skills.get(name) ?? [],
    );
    if (deps.agents && attached.length > 0)
      await deps.agents.skills.attach(
        { scope: 'project', scopeId: row.id },
        attached,
      );
  }

  // Issues, then their comments and checklists.
  const issueIds = new Map<string, string>();
  async function createIssue(spec: DemoIssue): Promise<void> {
    const executor: Executor | null = spec.executorAgent
      ? agents.has(spec.executorAgent)
        ? { type: 'agent', id: agents.get(spec.executorAgent)! }
        : null
      : spec.executor
        ? { type: 'user', id: userIds.get(spec.executor)! }
        : null;
    let issue = await projects.issues.create(admin, {
      title: spec.title,
      description: withMentions(spec.description),
      statusKey: CREATE_STATUS[spec.status] ?? spec.status,
      priority: spec.priority as Priority,
      ownerUserId: userIds.get(spec.owner),
      executor,
      // An agent executor waits: no demo runtime is online.
      start: false,
      projectId: spec.project ? (projectIds.get(spec.project) ?? null) : null,
      parentIssueId: spec.parent ? (issueIds.get(spec.parent) ?? null) : null,
      blockedBy: (spec.blockedBy ?? []).flatMap(
        (key) => issueIds.get(key) ?? [],
      ),
      labelIds: spec.labels.flatMap((name) => labels.get(name) ?? []),
      startDate: spec.start === undefined ? null : day(spec.start),
      dueDate: spec.due === undefined ? null : day(spec.due),
    });
    issueIds.set(spec.key, issue.id);
    created('issues');
    // The design proposal, written as its agent as `nb-studio issue design-proposal` would (`agents/design.ts`).
    if (spec.proposal && executor?.type === 'agent') {
      await projects.comments.post(
        { type: AGENT_KIND, id: executor.id },
        issue.id,
        { content: spec.proposal },
        { kind: DESIGN_PROPOSAL_KIND, trigger: false },
      );
      created('design proposals');
    }
    if (issue.statusKey !== spec.status)
      issue = await projects.issues.update(admin, issue.id, {
        revision: issue.revision,
        statusKey: spec.status,
      });

    let previous: {
      readonly id: string;
      readonly rootId?: string | null;
    } | null = null;
    for (const comment of spec.comments ?? []) {
      const { comment: row } = await projects.comments.create(
        await viewerOf(comment.by),
        issue.id,
        {
          content: withMentions(comment.text),
          ...(comment.replyToPrev && previous
            ? { parentId: previous.rootId ?? previous.id }
            : {}),
        },
      );
      previous = row;
      created('comments');
    }
    for (const itemKey of reviewChecklist
      ? (spec.checklistChecked ?? [])
      : []) {
      await projects.checklists.set(admin, issue.id, spec.status, itemKey, {
        checked: true,
      });
      created('checklist checks');
    }
  }
  for (const spec of DEMO_ISSUES)
    try {
      await createIssue(spec);
    } catch (error) {
      // One issue the services refuse leaves the rest of the demo standing.
      warn(`Demo issue "${spec.title}" was not created`, error);
    }

  // Knowledge: the system's documents by the administrator, each project's by its writer, then one change an agent
  // proposed from its work on an issue, waiting for the project's lead.
  const knowledge = deps.knowledge;
  if (knowledge) {
    const docIds = new Map<string, string>();
    for (const spec of DEMO_KNOWLEDGE)
      try {
        const projectId =
          spec.space === 'system' ? null : projectIds.get(spec.space);
        if (spec.space !== 'system' && !projectId) continue;
        const writer = { userId: userIds.get(spec.by) ?? deps.adminId };
        const doc = await knowledge.docs.create(writer, {
          scope: projectId ? 'project' : 'system',
          scopeId: projectId ?? '',
          title: spec.title,
          slug: spec.slug,
          summary: spec.summary,
          content: spec.content,
          ...(spec.parent && docIds.has(spec.parent)
            ? { parentId: docIds.get(spec.parent) }
            : {}),
        });
        docIds.set(spec.key, doc.id);
        if (spec.verified) await knowledge.docs.verify(writer, doc.id);
        created('knowledge documents');
      } catch (error) {
        warn(`Demo knowledge "${spec.title}" was not created`, error);
      }
    const proposal = DEMO_KNOWLEDGE_PROPOSAL;
    const agentId = agents.get(proposal.agent);
    const docId = docIds.get(proposal.doc);
    const forUser = userIds.get(proposal.for);
    const issueId = issueIds.get(proposal.issue);
    if (agentId && docId && forUser)
      try {
        const issue = issueId
          ? await projects.issueQueries.detail(admin, issueId)
          : null;
        await knowledge.proposals.propose(
          { userId: forUser, actor: { kind: AGENT_KIND, id: agentId } },
          {
            kind: 'update',
            docId,
            content: proposal.content,
            reason: proposal.reason,
            source: issue
              ? {
                  kind: 'issue',
                  id: issue.id,
                  title: `${issue.identifier} ${issue.title}`,
                  url: `/issues/${issue.identifier}`,
                }
              : null,
          },
        );
        created('knowledge proposals');
      } catch (error) {
        warn('The demo knowledge proposal was not made', error);
      }
  }

  // The past: work finished over the last two months, and the agents' runs on it.
  if (deps.connection)
    await buildDemoHistory({
      projects,
      admin,
      connection: deps.connection,
      now,
      projectIds,
      agentIds: agents,
      userIds,
      issueIds,
      created,
      warn,
    });
  return summary;
}
