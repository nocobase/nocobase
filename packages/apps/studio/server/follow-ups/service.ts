/**
 * "My follow-ups" (`shared/follow-ups.ts`): the issues a person owns that are still open and the ones they follow, each
 * with what it waits for now (`issueProgress`), and for a followed one what happened since they last looked. What a
 * person follows and when they last looked are their own preferences, read and written through the users plugin's
 * service; nothing else is stored.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';

import {
  FOLLOW_UP_STATUSES,
  FOLLOW_UPS_MAX,
  FOLLOWING_PREFERENCE,
  OWNED_PER_STATUS_MAX,
  SEEN_PREFERENCE,
  UNREAD_MAX,
  parseFollowing,
  parseSeen,
  pruneSeen,
  type FollowingView,
  type FollowUpIssue,
  type FollowUpStatus,
  type FollowUpsView,
} from '../../shared/follow-ups.js';
import { studioError } from '../http/errors.js';
import { issueProgress } from '../agents/manager/progress.js';

/** The part of the users plugin's preferences service this reads and writes. */
export interface FollowUpPreferences {
  get(userId: string, key: string): Promise<unknown>;
  set(userId: string, key: string, value: unknown): Promise<void>;
}

export interface FollowUpsDeps {
  readonly projects: Pick<
    Projects,
    'issueQueries' | 'commentQueries' | 'issueContext' | 'tx'
  >;
  readonly agents: Pick<Agents, 'runs' | 'agents' | 'runners' | 'availability'>;
  readonly preferences: FollowUpPreferences;
  readonly now?: () => Date;
}

export interface FollowUps {
  overview(viewer: Viewer): Promise<FollowUpsView>;
  /** Replaces what the viewer follows; 400 when an issue is not one they can see. */
  setFollowing(
    viewer: Viewer,
    issueIds: readonly string[],
  ): Promise<FollowingView>;
  /** Records that the viewer looked at the issue now; 404 when they cannot see it. */
  markSeen(viewer: Viewer, issueId: string): Promise<void>;
}

/** Records of work the system did not start, which say nothing new to a person. */
const QUIET_ACTIONS: ReadonlySet<string> = new Set([
  'work_skipped',
  'owner_notified',
]);

/** How many issues' progress is worked out at once. */
const CONCURRENCY = 6;

async function mapLimited<T, R>(
  items: readonly T[],
  map: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await map(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker),
  );
  return results;
}

const byActivity = (a: IssueListItem, b: IssueListItem): number =>
  Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);

export function createFollowUps(deps: FollowUpsDeps): FollowUps {
  const { projects, agents, preferences } = deps;
  const now = deps.now ?? (() => new Date());

  /** The issues among `ids` the viewer can see, by id. */
  async function visible(
    viewer: Viewer,
    ids: readonly string[],
  ): Promise<Map<string, IssueListItem>> {
    if (ids.length === 0) return new Map();
    const { issues } = await projects.issueQueries.matching(
      viewer,
      {},
      { issueIds: ids, limit: ids.length },
    );
    return new Map(
      issues
        .filter((issue) => !issue.deletedAt)
        .map((issue) => [issue.id, issue]),
    );
  }

  async function readSeen(userId: string): Promise<Record<string, string>> {
    return parseSeen(await preferences.get(userId, SEEN_PREFERENCE));
  }

  /** Comments and changes on the issue by anyone but the viewer after `since` (a comment is recorded as one). */
  async function unreadOf(
    viewer: Viewer,
    issueId: string,
    since: string,
  ): Promise<number> {
    const after = Date.parse(since);
    const { data } = await projects.issueQueries.activities(viewer, issueId, {
      limit: UNREAD_MAX,
    });
    return data.filter(
      (activity) =>
        Date.parse(activity.createdAt) > after &&
        !QUIET_ACTIONS.has(activity.action) &&
        !(activity.actorType === 'user' && activity.actorId === viewer.userId),
    ).length;
  }

  return {
    async overview(viewer) {
      const userId = viewer.userId;
      const pages = await Promise.all(
        FOLLOW_UP_STATUSES.map((statusKey) =>
          projects.issueQueries.page(viewer, {
            ownerUserId: userId,
            statusKey,
            limit: OWNED_PER_STATUS_MAX,
          }),
        ),
      );
      const counts = Object.fromEntries(
        FOLLOW_UP_STATUSES.map((status, index) => [
          status,
          pages[index]?.data.length ?? 0,
        ]),
      ) as Record<FollowUpStatus, number>;
      const truncated = pages.some((page) => page.nextCursor !== null);
      const owned = pages
        .flatMap((page) => page.data)
        .filter((issue) => !issue.deletedAt)
        .sort(byActivity);
      const ownedById = new Map(owned.map((issue) => [issue.id, issue]));

      const stored = parseFollowing(
        await preferences.get(userId, FOLLOWING_PREFERENCE),
      );
      const chosen =
        stored ??
        owned
          .filter(
            (issue) =>
              issue.statusKey === 'blocked' || issue.statusKey === 'in_review',
          )
          .slice(0, FOLLOW_UPS_MAX)
          .map((issue) => issue.id);
      const others = await visible(
        viewer,
        chosen.filter((id) => !ownedById.has(id)),
      );
      const following = chosen.filter(
        (id) => ownedById.has(id) || others.has(id),
      );
      const followed = new Set(following);
      const seen = await readSeen(userId);

      const issues = [
        ...owned,
        ...following.flatMap((id) => {
          const issue = others.get(id);
          return issue ? [issue] : [];
        }),
      ];
      const conn = projects.tx.read();
      const summaries = await mapLimited(
        issues,
        async (issue): Promise<FollowUpIssue> => {
          const isFollowed = followed.has(issue.id);
          const isOwned = ownedById.has(issue.id);
          const seenAt = isFollowed ? (seen[issue.id] ?? null) : null;
          const wantsProgress = isFollowed || issue.statusKey !== 'backlog';
          return {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            statusKey: issue.statusKey,
            projectId: issue.projectId,
            executorName: issue.executorName,
            lastActivityAt: issue.lastActivityAt,
            owned: isOwned,
            followed: isFollowed,
            progress: wantsProgress
              ? await issueProgress({ agents, projects }, conn, issue)
              : null,
            unread: seenAt ? await unreadOf(viewer, issue.id, seenAt) : 0,
            seenAt,
          };
        },
      );
      return {
        following,
        followingStored: stored !== null,
        issues: summaries,
        counts,
        truncated,
      };
    },

    async setFollowing(viewer, issueIds) {
      const ids = [...new Set(issueIds)];
      if (ids.length > FOLLOW_UPS_MAX)
        throw studioError(
          'INVALID_ARGUMENT',
          'FOLLOW_UPS_LIMIT',
          `Follow at most ${FOLLOW_UPS_MAX} issues.`,
          {
            fieldViolations: [
              {
                field: 'issueIds',
                description: `At most ${FOLLOW_UPS_MAX} issues.`,
              },
            ],
          },
        );
      const found = await visible(viewer, ids);
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length > 0)
        throw studioError(
          'INVALID_ARGUMENT',
          'FOLLOW_UP_ISSUE_NOT_FOUND',
          'An issue to follow was not found.',
          {
            fieldViolations: missing.map((id) => ({
              field: 'issueIds',
              description: `Issue ${id} was not found.`,
            })),
          },
        );
      const userId = viewer.userId;
      // A newly followed issue counts what happens from now on, not its whole history.
      const seen = await readSeen(userId);
      const at = now().toISOString();
      let changed = false;
      for (const id of ids)
        if (!seen[id]) {
          seen[id] = at;
          changed = true;
        }
      if (changed)
        await preferences.set(userId, SEEN_PREFERENCE, pruneSeen(seen, ids));
      await preferences.set(userId, FOLLOWING_PREFERENCE, ids);
      return { issueIds: ids };
    },

    async markSeen(viewer, issueId) {
      const found = await visible(viewer, [issueId]);
      if (!found.has(issueId))
        throw studioError('NOT_FOUND', 'ISSUE_NOT_FOUND', 'Issue not found.');
      const userId = viewer.userId;
      const following =
        parseFollowing(await preferences.get(userId, FOLLOWING_PREFERENCE)) ??
        [];
      const seen = await readSeen(userId);
      seen[issueId] = now().toISOString();
      await preferences.set(
        userId,
        SEEN_PREFERENCE,
        pruneSeen(seen, following),
      );
    },
  };
}
