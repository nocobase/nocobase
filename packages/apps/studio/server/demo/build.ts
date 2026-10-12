/**
 * Builds Studio's demo data (`data.ts`) through the plugins' own services, as people using Studio would: accounts through
 * user management, labels, projects, issues and comments through the projects plugin, skills, runtimes and agents
 * through the agents plugin, the project manager's choice through Studio's project manager, knowledge through the
 * knowledge plugin. The work items therefore carry identifiers, activity and inbox notices like any other.
 *
 * Its runtimes register once, reporting their coding tools and models, which discovers an agent for each (pending);
 * the demo then enables some with what they are good at and their skills, and makes two of them the project manager's
 * first choice and fallback. The runtimes go offline, so issues the project manager executes are not started.
 *
 * Issues are created in a status a new issue may start in (`START_STATUSES`) and then moved. Its past — issues finished
 * over the last two months and the agents' runs on them — is written directly, dated back (`history.ts`), so the
 * dashboard has figures from the start. The administrator creates the structure; each comment is written by its author.
 */
import {
  runnerAgentId,
  type Agents,
} from '@nocobase/app-plugin-agents/server/tokens';
import { PROTOCOL_VERSION, RUNNER_FEATURES } from '@nocobase/agent-protocol';
import { composeSkillMarkdown } from '@nocobase/app-plugin-agents/shared/skills';
import type { Knowledge } from '@nocobase/app-plugin-knowledge/server/tokens';
import type {
  Projects,
  ProjectsAccess,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Priority } from '@nocobase/app-plugin-projects/shared/common';
import type { Executor } from '@nocobase/app-plugin-projects/shared/issues';
import type { ProjectStatus } from '@nocobase/app-plugin-projects/shared/projects';
import {
  BACKLOG_STATUS,
  IN_PROGRESS_STATUS,
  START_STATUSES,
} from '@nocobase/app-plugin-projects/shared/statuses';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import type { ProjectManager } from '../agents/manager/service.js';
import { AGENT_KIND } from '../agents/tx.js';
import {
  DEMO_AGENTS,
  DEMO_ISSUES,
  DEMO_KNOWLEDGE,
  DEMO_KNOWLEDGE_PROPOSAL,
  DEMO_LABELS,
  DEMO_PASSWORD,
  DEMO_PROJECT_MANAGER,
  DEMO_PROJECTS,
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
  /** The agents plugin; without it no skills, runtimes or agents are created. */
  readonly agents: Agents | null;
  /** Studio's project manager; without it its first choice and fallback are left unchosen. */
  readonly projectManager?: Pick<ProjectManager, 'update'> | null;
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

/** The status an issue is created in before it is moved to its own: one a new issue may start in. */
export function createStatusOf(status: string): string {
  if (START_STATUSES.includes(status)) return status;
  return status === 'blocked' || status === 'in_review'
    ? IN_PROGRESS_STATUS
    : BACKLOG_STATUS;
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

  // Skills, runtimes and the agents their reports discover.
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

    // Runtimes: each registers once through a registration token its owner creates, as a runner does, reporting the
    // models of its coding tools, and is never heard from again; the sweeper marks it offline, so it shows on the
    // Runtimes page and takes no work. Its report discovers an agent for each tool and model, pending.
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
        tools: runtime.tools.map((tool) => ({
          kind: tool.kind,
          authenticated: true,
          ...(tool.models.length > 0
            ? {
                models: tool.models.map((id) => ({ id })),
                modelsSource: 'detected' as const,
                modelsDetectionStatus: 'detected' as const,
              }
            : {}),
        })),
      });
      if (runtime.acceptJobs)
        await deps.agents.runners.update(registered.runnerId, {
          acceptJobs: true,
        });
      created('runtimes');
    }

    // The discovered agents the demo enables, with what each is good at and its skills, as an administrator would.
    for (const spec of DEMO_AGENTS)
      try {
        const id = runnerAgentId(spec.tool, spec.model);
        const agent = await deps.agents.agents.get(id);
        await deps.agents.agents.update(id, deps.adminId, {
          description: spec.description,
          enabled: true,
          expectedRevision: agent.revision,
        });
        const attached = spec.skills.flatMap((name) => skills.get(name) ?? []);
        if (attached.length > 0)
          await deps.agents.skills.attach(
            { scope: 'agent', scopeId: id },
            attached,
          );
        agents.set(spec.key, id);
        created('agents');
      } catch (error) {
        warn(`Demo agent ${spec.tool} ${spec.model} was not enabled`, error);
      }

    // The project manager runs with two of them.
    const firstChoice = agents.get(DEMO_PROJECT_MANAGER.firstChoice);
    if (deps.projectManager && firstChoice)
      try {
        await deps.projectManager.update(deps.adminId, {
          firstChoiceAgentId: firstChoice,
          fallbackAgentId: agents.get(DEMO_PROJECT_MANAGER.fallback) ?? null,
        });
      } catch (error) {
        warn('The project manager’s agents were not chosen', error);
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

  // Issues, then their comments.
  const issueIds = new Map<string, string>();
  async function createIssue(spec: DemoIssue): Promise<void> {
    const executor: Executor | null = spec.projectManager
      ? deps.agents
        ? { type: AGENT_KIND, id: PROJECT_MANAGER_ID }
        : null
      : spec.executor
        ? { type: 'user', id: userIds.get(spec.executor)! }
        : null;
    let issue = await projects.issues.create(admin, {
      title: spec.title,
      description: withMentions(spec.description),
      statusKey: createStatusOf(spec.status),
      priority: spec.priority as Priority,
      ownerUserId: userIds.get(spec.owner),
      executor,
      // The project manager waits: no demo runtime is online.
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
