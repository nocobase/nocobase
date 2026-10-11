/** An issue's latest activity, as the projects contributor's detail pane lists it (`pages/inbox/recent-activity.tsx`). */
import type {
  Activity,
  IssueDetail,
} from '@nocobase/app-plugin-projects/shared/issues';

/** A comment as one line of plain text: mentions as `@name`, without Markdown marks, cut at `max`. */
export function commentSnippet(content: string, max = 120): string {
  const text = content
    .replace(/\[@([^\]]*)\]\(mention:\/\/[^)]+\)/gu, '@$1')
    .replace(/^\s*\/note\b/u, '')
    .replace(/[`*_>#~]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

type IssueComment = IssueDetail['threads'][number]['root'];

/** One line of an issue's latest activity: a change or a comment. */
export type RecentEvent =
  | { readonly key: string; readonly at: string; readonly activity: Activity }
  | {
      readonly key: string;
      readonly at: string;
      readonly comment: IssueComment;
    };

/** The issue's latest `limit` events, newest first: its changes and its comments (deleted ones left out) as one list. */
export function recentEvents(
  detail: Pick<IssueDetail, 'activities' | 'threads'>,
  limit = 5,
): RecentEvent[] {
  const activities: RecentEvent[] = detail.activities.map((activity) => ({
    key: `a:${activity.id}`,
    at: activity.createdAt,
    activity,
  }));
  const comments: RecentEvent[] = detail.threads
    .flatMap((thread) => [thread.root, ...thread.replies])
    .filter((comment) => !comment.deleted)
    .map((comment) => ({
      key: `c:${comment.id}`,
      at: comment.createdAt,
      comment,
    }));
  return [...activities, ...comments]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
