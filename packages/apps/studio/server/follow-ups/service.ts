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
  FOLLOW_UPS_DEFAULT_MAX,
  FOLLOW_UPS_MAX,
  FOLLOWING_PREFERENCE,
  OWNED_PER_STATUS_MAX,
  SEEN_PREFERENCE,
  UNREAD_MAX,
  parseFollowing,
  parseSeen,
  pruneSeen,
  type FollowingState,
  type FollowingView,
  type FollowUpIssue,
  type FollowUpStatus,
  type FollowUpsView,
} from '../../shared/follow-ups.js';
import { studioError } from '../http/errors.js';
import {
  issueProgress,
  prefetchProgressReads,
  type ProgressMemo,
} from '../agents/manager/progress.js';

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
  readonly agents: Pick<
    Agents,
    'runs' | 'agents' | 'runners' | 'claims' | 'availability'
  >;
  readonly preferences: FollowUpPreferences;
  readonly now?: () => Date;
}

export interface FollowUps {
  overview(viewer: Viewer): Promise<FollowUpsView>;
  /**
   * The overview's rows of the issues among `issueIds` it lists (the viewer's own in `FOLLOW_UP_STATUSES` and the ones
   * they follow), for the page to refresh only them; the others are left out.
   */
  rows(viewer: Viewer, issueIds: readonly string[]): Promise<FollowUpIssue[]>;
  /** What the viewer follows now, the issues they can no longer see left out, and how many they may. */
  following(viewer: Viewer): Promise<FollowingState>;
  /** Replaces what the viewer follows; 400 when an issue is not one they can see. */
  setFollowing(
    viewer: Viewer,
    issueIds: readonly string[],
  ): Promise<FollowingView>;
  /**
   * Adds one issue (an id or an identifier) to what the viewer follows; following it already changes nothing. 404 when
   * they cannot see it, `FOLLOWING_LIMIT_REACHED` when they follow as many as allowed.
   */
  follow(viewer: Viewer, issueIdOrKey: string): Promise<FollowingView>;
  /** Takes one issue off what the viewer follows; not following it changes nothing. 404 when they cannot see it. */
  unfollow(viewer: Viewer, issueIdOrKey: string): Promise<FollowingView>;
  /** Records that the viewer looked at the issue now; 404 when they cannot see it. */
  markSeen(viewer: Viewer, issueId: string): Promise<void>;
  /**
   * What the viewer follows, in order, and how much happened on each since they last looked; without the overview's
   * progress, for the issue lists' follow group. `visibleIds`, the issues the caller has already read as visible to
   * the viewer, saves reading them again.
   */
  followState(
    viewer: Viewer,
    visibleIds?: ReadonlySet<string>,
  ): Promise<FollowState>;
}

export interface FollowState {
  readonly ids: readonly string[];
  readonly unread: ReadonlyMap<string, number>;
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

  /**
   * Per issue, the comments and changes by anyone but the viewer after the time given for it (a comment is recorded as
   * one), at most `UNREAD_MAX`: one grouped count for all of them. The caller has checked the viewer sees the issues.
   */
  async function unreadCounts(
    viewer: Viewer,
    since: ReadonlyMap<string, string>,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (since.size === 0) return counts;
    const groups = await projects.tx
      .read()
      .repository<{
        issueId: string;
        actorType: string;
        actorId: string | null;
        action: string;
        createdAt: string | Date;
      }>('pmActivities')
      .groupBy({
        by: ['issueId'],
        aggregate: (aggregate) => ({ count: aggregate.count() }),
        filter: (f) =>
          f.and([
            f.or(
              [...since].map(([issueId, at]) =>
                f.and([
                  f.string('issueId').eq(issueId),
                  f.date('createdAt').after(new Date(at).toISOString()),
                ]),
              ),
            ),
            ...[...QUIET_ACTIONS].map((action) =>
              f.string('action').ne(action),
            ),
            f.or([
              f.string('actorType').ne('user'),
              f.string('actorId').eq(null),
              f.string('actorId').ne(viewer.userId),
            ]),
          ]),
      });
    for (const group of groups)
      counts.set(
        String(group.issueId),
        Math.min(Number(group.count), UNREAD_MAX),
      );
    return counts;
  }

  /** Until the viewer chooses, what they follow: their blocked and in-review issues, newest first. */
  async function defaultFollowing(viewer: Viewer): Promise<string[]> {
    const pages = await Promise.all(
      (['in_review', 'blocked'] as const).map((statusKey) =>
        projects.issueQueries.page(viewer, {
          ownerUserId: viewer.userId,
          statusKey,
          limit: OWNED_PER_STATUS_MAX,
        }),
      ),
    );
    return pages
      .flatMap((page) => page.data)
      .filter((issue) => !issue.deletedAt)
      .sort(byActivity)
      .slice(0, FOLLOW_UPS_DEFAULT_MAX)
      .map((issue) => issue.id);
  }

  /** What the viewer follows now, as the overview shows it: only issues they can still see. */
  async function currentFollowing(viewer: Viewer): Promise<{
    readonly ids: string[];
    readonly stored: boolean;
  }> {
    const stored = parseFollowing(
      await preferences.get(viewer.userId, FOLLOWING_PREFERENCE),
    );
    const chosen = stored ?? (await defaultFollowing(viewer));
    const found = await visible(viewer, chosen);
    return {
      ids: chosen.filter((id) => found.has(id)),
      stored: stored !== null,
    };
  }

  /**
   * What the viewer chose to follow, only issues they can still see. Starring and the issue lists go by this alone: the
   * overview's defaults stand in for a choice on "My follow-ups" only, and never become one by themselves.
   */
  async function chosenFollowing(viewer: Viewer): Promise<string[]> {
    const stored =
      parseFollowing(
        await preferences.get(viewer.userId, FOLLOWING_PREFERENCE),
      ) ?? [];
    const found = await visible(viewer, stored);
    return stored.filter((id) => found.has(id));
  }

  /** The issue's id; 404 when the viewer cannot see it. */
  async function issueIdOf(viewer: Viewer, issueIdOrKey: string) {
    const issue = await projects.issueQueries.visible(viewer, issueIdOrKey);
    if (issue.deletedAt)
      throw studioError('NOT_FOUND', 'ISSUE_NOT_FOUND', 'Issue not found.');
    return issue.id;
  }

  async function saveFollowing(
    viewer: Viewer,
    ids: readonly string[],
  ): Promise<FollowingView> {
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
    await preferences.set(userId, FOLLOWING_PREFERENCE, [...ids]);
    return { issueIds: [...ids] };
  }

  /** The rows of `issues`, each with its progress, read for all of them at once, and its unread count. */
  async function summarize(
    viewer: Viewer,
    issues: readonly IssueListItem[],
    owns: (issue: IssueListItem) => boolean,
    followed: ReadonlySet<string>,
    seen: Readonly<Record<string, string>>,
  ): Promise<FollowUpIssue[]> {
    const conn = projects.tx.read();
    const memo: ProgressMemo = new Map();
    const progressViewer = { userId: viewer.userId, seesMachines: false };
    const wantsProgress = (issue: IssueListItem) =>
      followed.has(issue.id) || issue.statusKey !== 'backlog';
    const reads = await prefetchProgressReads(
      { agents, projects },
      conn,
      issues.filter(wantsProgress),
      progressViewer,
    );
    const unread = await unreadCounts(
      viewer,
      new Map(
        issues.flatMap((issue) => {
          const at = followed.has(issue.id) ? seen[issue.id] : undefined;
          return at ? [[issue.id, at] as const] : [];
        }),
      ),
    );
    return mapLimited(issues, async (issue): Promise<FollowUpIssue> => {
      const isFollowed = followed.has(issue.id);
      const seenAt = isFollowed ? (seen[issue.id] ?? null) : null;
      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        statusKey: issue.statusKey,
        projectId: issue.projectId,
        executorName: issue.executorName,
        lastActivityAt: issue.lastActivityAt,
        owned: owns(issue),
        followed: isFollowed,
        progress: wantsProgress(issue)
          ? await issueProgress(
              { agents, projects },
              conn,
              issue,
              progressViewer,
              memo,
              { reads, list: true },
            )
          : null,
        unread: seenAt ? (unread.get(issue.id) ?? 0) : 0,
        seenAt,
      };
    });
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
          .slice(0, FOLLOW_UPS_DEFAULT_MAX)
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
      const summaries = await summarize(
        viewer,
        issues,
        (issue) => ownedById.has(issue.id),
        followed,
        seen,
      );
      return {
        following,
        followingStored: stored !== null,
        issues: summaries,
        counts,
        truncated,
      };
    },

    async rows(viewer, issueIds) {
      const found = await visible(viewer, [...new Set(issueIds)]);
      if (found.size === 0) return [];
      const { ids: following } = await currentFollowing(viewer);
      const followed = new Set(following);
      const owns = (issue: IssueListItem) =>
        issue.ownerUserId === viewer.userId &&
        (FOLLOW_UP_STATUSES as readonly string[]).includes(issue.statusKey);
      const listed = [...found.values()].filter(
        (issue) => owns(issue) || followed.has(issue.id),
      );
      if (listed.length === 0) return [];
      return summarize(
        viewer,
        listed,
        owns,
        followed,
        await readSeen(viewer.userId),
      );
    },

    async following(viewer) {
      const { ids, stored } = await currentFollowing(viewer);
      return { issueIds: ids, max: FOLLOW_UPS_MAX, stored };
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
      return saveFollowing(viewer, ids);
    },

    async follow(viewer, issueIdOrKey) {
      const issueId = await issueIdOf(viewer, issueIdOrKey);
      const ids = await chosenFollowing(viewer);
      if (ids.includes(issueId)) return { issueIds: ids };
      if (ids.length >= FOLLOW_UPS_MAX)
        throw studioError(
          'FAILED_PRECONDITION',
          'FOLLOWING_LIMIT_REACHED',
          `You follow ${FOLLOW_UPS_MAX} issues already. Unfollow one first.`,
          { metadata: { max: String(FOLLOW_UPS_MAX) } },
        );
      return saveFollowing(viewer, [...ids, issueId]);
    },

    async unfollow(viewer, issueIdOrKey) {
      const issueId = await issueIdOf(viewer, issueIdOrKey);
      // Unfollowing one of "My follow-ups"' defaults keeps the others, which become the viewer's choice.
      const stored = parseFollowing(
        await preferences.get(viewer.userId, FOLLOWING_PREFERENCE),
      );
      const ids =
        stored === null
          ? await (async () => {
              const defaults = await defaultFollowing(viewer);
              const found = await visible(viewer, defaults);
              return defaults.filter((id) => found.has(id));
            })()
          : await chosenFollowing(viewer);
      if (!ids.includes(issueId)) return { issueIds: ids };
      return saveFollowing(
        viewer,
        ids.filter((id) => id !== issueId),
      );
    },

    async followState(viewer, visibleIds) {
      const stored =
        parseFollowing(
          await preferences.get(viewer.userId, FOLLOWING_PREFERENCE),
        ) ?? [];
      const ids = visibleIds
        ? stored.filter((id) => visibleIds.has(id))
        : await chosenFollowing(viewer);
      const seen = await readSeen(viewer.userId);
      const counts = await unreadCounts(
        viewer,
        new Map(
          ids.flatMap((id) => {
            const at = seen[id];
            return at ? [[id, at] as const] : [];
          }),
        ),
      );
      return {
        ids,
        unread: new Map(ids.map((id) => [id, counts.get(id) ?? 0])),
      };
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
