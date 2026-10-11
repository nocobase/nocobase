/**
 * Who is asking, in a conversation run's brief (a brief section of the agents plugin, `briefs.sections`): the person's roles, the projects they belong to, the open issues they own or
 * work on, and how many decisions wait on them. The agent still reads details through its commands; this saves it the
 * first round of lookups and tells it whom it talks to.
 *
 * Everything is read as the person sees it, before the claim's transaction (`prepare`): the projects plugin's queries,
 * Studio's roles and inbox. The section sits in the brief's context layer, outside the session fingerprint, so a summary
 * that changes does not end a resumable session. Only for runs on a conversation.
 */
import type {
  Agents,
  BriefSectionProvider,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  IssueListItem,
  StatusCategory,
} from '@nocobase/app-plugin-projects/shared/issues';

import type { PermissionSource } from '../commands/permissions.js';

/** Projects listed at most, and looked at for membership at most. */
export const ASKER_PROJECTS_MAX = 20;
const PROJECTS_SCANNED = 50;
/** Open issues listed at most; the counts cover up to `ISSUES_READ` of each kind. */
export const ASKER_ISSUES_MAX = 8;
const ISSUES_READ = 100;
const FINISHED: ReadonlySet<StatusCategory> = new Set(['done', 'closed']);

/** The person's roles, in English: a role's title, or what a built-in role is called. */
export type RolesOf = (userId: string) => Promise<{
  readonly roles: readonly string[];
  /** A system administrator, who may do everything. */
  readonly superuser: boolean;
}>;

export interface AskerSummary {
  readonly userId: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly superuser: boolean;
  /** The projects they belong to (or lead), not finished, at most `ASKER_PROJECTS_MAX`. */
  readonly projects: readonly {
    readonly id: string;
    readonly name: string;
    readonly lead: boolean;
  }[];
  /** Open issues they own. */
  readonly ownedOpen: number;
  /** Of those, the ones being worked on (a status of the `started` category). */
  readonly ownedStarted: number;
  /** Open issues they execute themselves. */
  readonly executingOpen: number;
  /** The newest of both, at most `ASKER_ISSUES_MAX`. */
  readonly issues: readonly {
    readonly identifier: string;
    readonly title: string;
    readonly status: string;
    readonly role: 'owner' | 'executor' | 'both';
  }[];
  /** Decisions in their inbox still waiting on them; null when Studio keeps no inbox. */
  readonly pendingDecisions: number | null;
}

export interface AskerSummaryDeps {
  readonly agents: Pick<Agents, 'conversations' | 'tx' | 'people'>;
  readonly projects: () => Pick<Projects, 'projects' | 'issueQueries'>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
  /** Studio's roles; without them none are named. */
  readonly rolesOf?: RolesOf;
  /** Decisions waiting on a person, from Studio's inbox; undefined without one. */
  readonly pendingOf?: () => ((userId: string) => Promise<number>) | undefined;
}

async function openIssues(
  deps: AskerSummaryDeps,
  viewer: Viewer,
): Promise<
  Pick<AskerSummary, 'ownedOpen' | 'ownedStarted' | 'executingOpen' | 'issues'>
> {
  const queries = deps.projects().issueQueries;
  const [owned, executing] = await Promise.all([
    queries.page(viewer, {
      ownerUserId: viewer.userId,
      sort: 'updated',
      limit: ISSUES_READ,
    }),
    queries.page(viewer, {
      executorId: viewer.userId,
      sort: 'updated',
      limit: ISSUES_READ,
    }),
  ]);
  const categories = new Map<string, Map<string, StatusCategory>>();
  async function categoryOf(issue: IssueListItem): Promise<StatusCategory> {
    const key = issue.projectId ?? '';
    let byStatus = categories.get(key);
    if (!byStatus) {
      byStatus = new Map(
        (await queries.statuses(viewer, issue.projectId).catch(() => [])).map(
          (status) => [status.key, status.category],
        ),
      );
      categories.set(key, byStatus);
    }
    return byStatus.get(issue.statusKey) ?? 'unstarted';
  }
  const open = async (list: readonly IssueListItem[]) => {
    const kept: { issue: IssueListItem; category: StatusCategory }[] = [];
    for (const issue of list) {
      const category = await categoryOf(issue);
      if (!FINISHED.has(category)) kept.push({ issue, category });
    }
    return kept;
  };
  const mine = await open(owned.data);
  const doing = await open(
    executing.data.filter((issue) => issue.executor?.type === 'user'),
  );
  const byId = new Map<
    string,
    { issue: IssueListItem; role: 'owner' | 'executor' | 'both' }
  >();
  for (const { issue } of mine) byId.set(issue.id, { issue, role: 'owner' });
  for (const { issue } of doing) {
    const known = byId.get(issue.id);
    byId.set(issue.id, { issue, role: known ? 'both' : 'executor' });
  }
  const newest = [...byId.values()]
    .sort((a, b) => b.issue.updatedAt.localeCompare(a.issue.updatedAt))
    .slice(0, ASKER_ISSUES_MAX);
  return {
    ownedOpen: mine.length,
    ownedStarted: mine.filter((entry) => entry.category === 'started').length,
    executingOpen: doing.length,
    issues: newest.map(({ issue, role }) => ({
      identifier: issue.identifier,
      title: issue.title,
      status: issue.statusKey,
      role,
    })),
  };
}

async function memberProjects(
  deps: AskerSummaryDeps,
  viewer: Viewer,
): Promise<AskerSummary['projects']> {
  const service = deps.projects().projects;
  const visible = (await service.list(viewer))
    .filter(
      (project) =>
        project.status !== 'completed' && project.status !== 'cancelled',
    )
    .slice(0, PROJECTS_SCANNED);
  const found: { id: string; name: string; lead: boolean }[] = [];
  for (const project of visible) {
    if (found.length >= ASKER_PROJECTS_MAX) break;
    const lead = project.leadUserId === viewer.userId;
    const member =
      lead ||
      (await service.get(viewer, project.id).catch(() => null))?.members.some(
        (person) => person.id === viewer.userId,
      ) === true;
    if (member) found.push({ id: project.id, name: project.name, lead });
  }
  return found;
}

/** What the brief says of the person a conversation run acts for. */
export async function askerSummary(
  deps: AskerSummaryDeps,
  userId: string,
): Promise<AskerSummary> {
  const viewer = await deps.permissions.viewerOf({
    kind: 'user',
    userId,
    displayName: userId,
  });
  const [names, roles, projects, issues, pending] = await Promise.all([
    deps.agents.people.names(deps.agents.tx.read(), [userId]),
    deps.rolesOf
      ? deps.rolesOf(userId).catch(() => ({ roles: [], superuser: false }))
      : Promise.resolve({ roles: [], superuser: false }),
    memberProjects(deps, viewer).catch(() => []),
    openIssues(deps, viewer).catch(() => ({
      ownedOpen: 0,
      ownedStarted: 0,
      executingOpen: 0,
      issues: [],
    })),
    (async () => {
      const of = deps.pendingOf?.();
      return of ? of(userId).catch(() => null) : null;
    })(),
  ]);
  return {
    userId,
    name: names.get(userId) ?? userId,
    roles: roles.roles,
    superuser: roles.superuser,
    projects,
    ...issues,
    pendingDecisions: pending,
  };
}

/** The brief's lines; English, with what people wrote quoted as written. */
export function askerSection(summary: AskerSummary): string {
  const roles = [
    ...(summary.superuser ? ['system administrator'] : []),
    ...summary.roles,
  ];
  const projects = summary.projects.map(
    (project) =>
      `${project.name} (${project.id}${project.lead ? ', lead' : ''})`,
  );
  const lines = [
    '## Who is asking',
    '',
    `- Name: ${summary.name} (user id ${summary.userId})`,
    `- Roles: ${roles.length > 0 ? roles.join(', ') : 'none named'}`,
    `- Projects: ${projects.length > 0 ? projects.join(', ') : 'none they belong to'}${summary.projects.length >= ASKER_PROJECTS_MAX ? ' (and more)' : ''}`,
    `- Open work: owns ${summary.ownedOpen} open issues (${summary.ownedStarted} in progress), executes ${summary.executingOpen}${summary.pendingDecisions === null ? '' : `; ${summary.pendingDecisions} decisions wait on them in their inbox`}.`,
  ];
  if (summary.issues.length > 0)
    lines.push(
      '- Their newest open issues:',
      ...summary.issues.map(
        (issue) =>
          `  - ${issue.identifier} [${issue.status}] ${issue.title}${issue.role === 'owner' ? '' : issue.role === 'executor' ? ' (executing)' : ' (owner, executing)'}`,
      ),
    );
  lines.push(
    '',
    'This is a snapshot from when this turn started: read the current state with the commands before you rely on it, and answer within what they may see.',
  );
  return lines.join('\n');
}

/** Whether a run works on a conversation for its owner. */
async function isConversation(
  deps: Pick<AskerSummaryDeps, 'agents'>,
  run: Pick<Run, 'subject' | 'actorUserId'>,
): Promise<boolean> {
  return Boolean(
    await deps.agents.conversations.ofRun(deps.agents.tx.read(), run),
  );
}

export function askerBriefSection(
  deps: AskerSummaryDeps,
): BriefSectionProvider {
  return {
    key: 'studio-asker',
    order: 5,
    async prepare(run) {
      if (!(await isConversation(deps, run))) return null;
      return askerSummary(deps, run.actorUserId);
    },
    section(_conn, _claim, _assembly, prepared) {
      const summary = prepared as AskerSummary | null | undefined;
      return Promise.resolve(summary ? askerSection(summary) : null);
    },
  };
}
