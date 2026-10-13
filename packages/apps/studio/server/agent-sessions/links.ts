/**
 * Issues as things tied to agent sessions (`issue` links): how each stands for the viewer, in their language, how it is
 * going for the session's agent, finding them for a `#` mention, and starting one from the session, which moves it from
 * Backlog to In progress as the viewer, so its default executor (an agent in a runtime) takes it.
 */
import type {
  LinkResolver,
  LinkView,
} from '@nocobase/app-plugin-agent-sessions/server';
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
}

/** The statuses whose next step is the owner's: deciding (Blocked) or accepting (In review). */
const OWNER_STEPS = new Set(['blocked', 'in_review']);

/** An issue as a session shows it to `readerId`, its status named by `statusName`. */
function issueView(
  issue: {
    readonly identifier: string;
    readonly title: string;
    readonly statusKey: string;
    readonly ownerUserId: string;
    readonly project?: { readonly name: string } | null;
  },
  readerId: string,
  statusName: (statusKey: string) => string,
): LinkView {
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
    },
    href: `/issues/${encodeURIComponent(issue.identifier)}`,
    startable: issue.statusKey === BACKLOG_STATUS,
  };
}

export function issueLinks(deps: IssueLinkDeps): LinkResolver {
  return {
    async resolve(refIds, reader) {
      const [viewer, statusName] = await Promise.all([
        deps.viewerOf(reader.userId),
        deps.statusNames(reader.locale),
      ]);
      const { issues } = await deps.projects.issueQueries.matching(
        viewer,
        {},
        { issueIds: [...refIds], limit: refIds.length },
      );
      return new Map(
        issues.map((issue): [string, LinkView] => [
          issue.id,
          issueView(issue, reader.userId, statusName),
        ]),
      );
    },
    async search(query, reader, { projectId, limit }) {
      const [viewer, statusName] = await Promise.all([
        deps.viewerOf(reader.userId),
        deps.statusNames(reader.locale),
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
        ...issueView(issue, reader.userId, statusName),
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
