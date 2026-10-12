/**
 * What "My follow-ups" shows, worked out from `GET /api/followUps` (`shared/follow-ups.ts`): the followed issues in
 * order, and the owned ones filtered by status and text and ordered by what needs the viewer first. What each says
 * about itself is the issue pages' (`../issues/live/summary-model.ts`).
 */
import {
  FOLLOW_UP_STATUSES,
  type FollowUpIssue,
  type FollowUpStatus,
  type FollowUpsView,
} from '../../shared/follow-ups.js';

export const followUpsKeys = {
  /** Under the projects plugin's issues, so its realtime refresh reads it again with every issue change. */
  overview: ['pm', 'issues', 'followUps'] as const,
};

/** The statuses selected when the page opens. */
export const DEFAULT_FILTER: readonly FollowUpStatus[] = ['in_review'];

export function isFollowUpStatus(value: string): value is FollowUpStatus {
  return (FOLLOW_UP_STATUSES as readonly string[]).includes(value);
}

/** The followed issues, in the order the viewer chose. */
export function followedIssues(view: FollowUpsView): FollowUpIssue[] {
  const byId = new Map(view.issues.map((issue) => [issue.id, issue]));
  return view.following.flatMap((id) => {
    const issue = byId.get(id);
    return issue ? [issue] : [];
  });
}

/**
 * The owned issues in the selected statuses (all of them when none is selected) whose title or key holds `query`: in
 * review, blocked, in progress, backlog, each by its latest activity.
 */
export function ownedRows(
  view: FollowUpsView,
  statuses: readonly FollowUpStatus[],
  query: string,
): FollowUpIssue[] {
  const text = query.trim().toLowerCase();
  const selected = new Set<string>(
    statuses.length > 0 ? statuses : FOLLOW_UP_STATUSES,
  );
  const rank = (status: string) =>
    (FOLLOW_UP_STATUSES as readonly string[]).indexOf(status);
  return view.issues
    .filter(
      (issue) =>
        issue.owned &&
        selected.has(issue.statusKey) &&
        (!text ||
          issue.title.toLowerCase().includes(text) ||
          issue.identifier.toLowerCase().includes(text)),
    )
    .sort(
      (a, b) =>
        rank(a.statusKey) - rank(b.statusKey) ||
        Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt),
    );
}
