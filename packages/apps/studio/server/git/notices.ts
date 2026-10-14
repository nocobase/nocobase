/**
 * The notice of a merged pull request (`pr_merged`): everyone following a linked issue
 * hears that the pull request was merged, except whoever merged it. It goes through the projects plugin's notices (a
 * notice rule), so it reaches the same inbox, only for those who may see the issue, merged per issue with the other
 * pull requests merged on it.
 *
 * The merge commits in a projects transaction that announces it (`work.announced` of kind `git.notice`, `flow.ts`);
 * the rule plans the notice there.
 */
import type {
  NoticeRule,
  PlannedNotice,
  Projects,
} from '@nocobase/app-plugin-projects/server/tokens';

/** The key of the announcements this file reads. */
export const GIT_NOTICE = 'git.notice';

/** The notice type. */
export const PR_MERGED = 'pr_merged';

export interface MergedAnnouncement {
  readonly type: 'prMerged';
  readonly issueIds: readonly string[];
  /** The Studio user who merged it, when Studio knows them. */
  readonly mergedByUserId: string | null;
  readonly pullRequest: {
    readonly id: string;
    readonly repo: string;
    readonly number: number;
    readonly url: string;
    readonly title: string;
  };
}

export function prMergedRule(
  projects: () => Pick<Projects, 'issueContext'>,
): NoticeRule {
  return async (context) => {
    const { tx, events } = context;
    const notices: PlannedNotice[] = [];
    for (const event of events) {
      if (event.type !== 'work.announced' || event.kind !== GIT_NOTICE)
        continue;
      const merged = event.payload as MergedAnnouncement;
      if (merged.type !== 'prMerged') continue;
      const { pullRequest: pr } = merged;
      const actorName = merged.mergedByUserId
        ? await context.nameOf('user', merged.mergedByUserId)
        : null;
      for (const issueId of new Set(merged.issueIds)) {
        const issue = await projects().issueContext.contextFor(
          tx.conn,
          issueId,
        );
        if (!issue) continue;
        notices.push({
          key: `git:merged:${pr.id}:${issue.id}`,
          kind: 'info',
          type: PR_MERGED,
          issue: {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
          },
          userIds: await context.subscribers(issue.id),
          actor: merged.mergedByUserId
            ? { type: 'user', id: merged.mergedByUserId, name: actorName }
            : { type: 'system', id: null, name: null },
          group: `merged:${issue.id}`,
          slot: 'change',
          params: {
            title: `${issue.identifier}: ${pr.repo}#${pr.number} was merged`,
            body: pr.title,
            identifier: issue.identifier,
            repo: pr.repo,
            number: String(pr.number),
            url: pr.url,
            pullRequestTitle: pr.title,
            ...(actorName ? { actorName } : {}),
          },
        });
      }
    }
    return notices;
  };
}
