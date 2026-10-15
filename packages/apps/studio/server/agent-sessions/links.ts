/**
 * Issues as things tied to agent sessions (`issue` links): how each stands for the viewer, in their language, how it is
 * going for the session's agent, finding them for a `#` mention, and starting one from the session, which moves it from
 * Backlog to In progress as the viewer, so its default executor (an agent in a runtime) takes it.
 */
import type {
  LinkResolver,
  LinkView,
} from '@nocobase/app-plugin-agent-sessions/server';
import type { SessionLinkIcon } from '@nocobase/app-plugin-agent-sessions/shared/api';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  BACKLOG_STATUS,
  DONE_STATUS,
  IN_PROGRESS_STATUS,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';

import type { WaitReason } from '../../shared/task-groups.js';
import { progressOf, type ProgressDeps } from './progress.js';

export interface IssueLinkDeps {
  readonly projects: Projects;
  /** How issues are going, for the agents; left out where the agents plugin is not installed. */
  readonly progress?: ProgressDeps | undefined;
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  /** Names statuses in `locale`, or in English without one. */
  readonly statusNames: (
    locale: string | undefined,
  ) => Promise<(statusKey: string) => string>;
  /** Words what an issue waits on the reader for (`WaitReason`) in `locale`, such as "Waiting for you to accept". */
  readonly waitNames?: (
    locale: string | undefined,
  ) => Promise<(reason: WaitReason) => string>;
}

/** The statuses whose next step is the owner's: deciding (Blocked) or accepting (In review). */
const OWNER_STEPS = new Set(['blocked', 'in_review']);

/** The shape each fixed status is drawn with, as the task lists draw it. */
const STATUS_ICON: Readonly<Record<string, SessionLinkIcon>> = {
  backlog: 'backlog',
  in_progress: 'started',
  blocked: 'blocked',
  in_review: 'review',
  done: 'done',
  cancelled: 'closed',
};

/** The icon of a status, by its key or else its category. */
export function statusIcon(statusKey: string): SessionLinkIcon {
  const icon = STATUS_ICON[statusKey];
  if (icon) return icon;
  const category = statusCategory(statusKey);
  return category === 'started'
    ? 'started'
    : category === 'closed'
      ? 'closed'
      : category === 'done'
        ? 'done'
        : 'backlog';
}

/**
 * What the issue waits on the reader for, by its status alone: accepting it in review, or answering it while it is
 * blocked by nothing but a question. The task lists' "Waiting for you" says more (`server/issues/task-waits.ts`).
 */
export function linkWait(
  issue: {
    readonly statusKey: string;
    readonly ownerUserId: string;
    readonly blockedCount?: number;
  },
  readerId: string,
): WaitReason | null {
  if (issue.ownerUserId !== readerId) return null;
  if (issue.statusKey === 'in_review') return 'accept';
  if (issue.statusKey === 'blocked' && !issue.blockedCount) return 'answer';
  return null;
}

/** An issue as a session shows it to `readerId`, its status named by `statusName`. */
function issueView(
  issue: {
    readonly identifier: string;
    readonly title: string;
    readonly statusKey: string;
    readonly ownerUserId: string;
    readonly blockedCount?: number;
    readonly project?: { readonly name: string } | null;
  },
  readerId: string,
  statusName: (statusKey: string) => string,
  waitName: ((reason: WaitReason) => string) | undefined,
): LinkView {
  const wait = linkWait(issue, readerId);
  return {
    key: issue.identifier,
    title: issue.title,
    group: issue.project?.name ?? null,
    status: {
      label: statusName(issue.statusKey),
      tone:
        issue.statusKey === BACKLOG_STATUS
          ? 'idle'
          : OWNER_STEPS.has(issue.statusKey) && issue.ownerUserId === readerId
            ? 'attention'
            : statusCategory(issue.statusKey) === 'started'
              ? 'active'
              : issue.statusKey === DONE_STATUS ||
                  statusCategory(issue.statusKey) === 'closed'
                ? 'done'
                : 'idle',
      icon: statusIcon(issue.statusKey),
      needsYou: wait && waitName ? waitName(wait) : null,
    },
    href: `/issues/${encodeURIComponent(issue.identifier)}`,
    startable: issue.statusKey === BACKLOG_STATUS,
  };
}

export function issueLinks(deps: IssueLinkDeps): LinkResolver {
  return {
    async resolve(refIds, reader) {
      const [viewer, statusName, waitName] = await Promise.all([
        deps.viewerOf(reader.userId),
        deps.statusNames(reader.locale),
        deps.waitNames?.(reader.locale),
      ]);
      const { issues } = await deps.projects.issueQueries.matching(
        viewer,
        {},
        { issueIds: [...refIds], limit: refIds.length },
      );
      return new Map(
        issues.map((issue): [string, LinkView] => [
          issue.id,
          issueView(issue, reader.userId, statusName, waitName),
        ]),
      );
    },
    async search(query, reader, { projectId, limit }) {
      const [viewer, statusName, waitName] = await Promise.all([
        deps.viewerOf(reader.userId),
        deps.statusNames(reader.locale),
        deps.waitNames?.(reader.locale),
      ]);
      const page = (inProject: string | null) =>
        deps.projects.issueQueries.page(viewer, {
          ...(query.trim() ? { q: query.trim() } : {}),
          ...(inProject ? { projectId: inProject } : {}),
          limit,
        });
      // The session's project first, then the others the reader may see.
      const first = projectId ? (await page(projectId)).data : [];
      const seen = new Set(first.map((issue) => issue.id));
      const found =
        first.length < limit
          ? [
              ...first,
              ...(await page(null)).data.filter((issue) => !seen.has(issue.id)),
            ]
          : first;
      return found.slice(0, limit).map((issue) => ({
        refId: issue.id,
        ...issueView(issue, reader.userId, statusName, waitName),
      }));
    },
    async progress(refIds, reader) {
      if (!deps.progress) return new Map();
      const { issues } = await deps.projects.issueQueries.matching(
        await deps.viewerOf(reader.userId),
        {},
        { issueIds: [...refIds], limit: refIds.length },
      );
      return progressOf(deps.progress, issues, reader.userId);
    },
    async start(refIds, reader) {
      const viewer = await deps.viewerOf(reader.userId);
      const { issues } = await deps.projects.issueQueries.matching(
        viewer,
        {},
        { issueIds: [...refIds], limit: refIds.length },
      );
      for (const issue of issues.filter(
        (candidate) => candidate.statusKey === BACKLOG_STATUS,
      )) {
        await deps.projects.issues.update(viewer, issue.id, {
          statusKey: IN_PROGRESS_STATUS,
          revision: issue.revision,
        });
      }
    },
  };
}
