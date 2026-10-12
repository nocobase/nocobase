/**
 * An issue's activity as "My follow-ups" tells it (`issue-panel.tsx`): one entry per thing that happened, newest
 * first, worded by what it means rather than as raw comments. Read from what the issue page already loads: the issue's
 * newest activities and comment threads, and its pull requests.
 *
 * - The project manager's comment that mentions agents hands them a step (`handOver`); its other comments say what it
 *   decided (`manager`).
 * - An agent's comment is a reply (`agentReply`), or a review (`review`) when it answers a hand-over that asked for one
 *   and says plainly whether the change can merge.
 * - A person's comment (`comment`), the viewer's own marked `mine`.
 * - Status moves (`status`), pull requests linked, merged or closed (`pullRequest`), and any other change (`change`).
 *
 * Comments are recorded as activities too; those, and the system's notes that it started no work, are left out.
 */
import type { CommentThread } from '@nocobase/app-plugin-projects/client/issues';
import type { Activity } from '@nocobase/app-plugin-projects/shared/issues';

import type { IssuePullRequest } from '../../shared/git.js';

export type FeedKind =
  | 'handOver'
  | 'manager'
  | 'agentReply'
  | 'review'
  | 'comment'
  | 'status'
  | 'pullRequest'
  | 'change';

export interface FeedActor {
  readonly type: string;
  readonly id: string | null;
  readonly name: string | null;
}

export interface FeedEvent {
  readonly id: string;
  readonly at: string;
  readonly kind: FeedKind;
  readonly actor: FeedActor;
  /** The viewer did it. */
  readonly mine: boolean;
  /** One line: the step handed over, or a comment's first line. */
  readonly summary: string | null;
  /** A short excerpt after the first line. */
  readonly excerpt: string | null;
  /** The whole comment, when there is more of it than the summary and excerpt show. */
  readonly body: string | null;
  /** The agents a hand-over names. */
  readonly agents: readonly string[];
  readonly verdict: 'approved' | 'changesRequested' | null;
  /** A status move. */
  readonly from: string | null;
  readonly to: string | null;
  /** A pull request event: what happened to which one. */
  readonly pullRequest: {
    readonly event: 'linked' | 'merged' | 'closed';
    readonly label: string;
    readonly url: string;
  } | null;
  /** Any other change, worded by the issue page's activity line. */
  readonly activity: Activity | null;
}

export interface FeedInput {
  readonly activities: readonly Activity[];
  readonly threads: readonly CommentThread[];
  readonly pullRequests?: readonly IssuePullRequest[];
  readonly viewerId: string | null;
  readonly managerId: string;
  /** The most entries; the newest are kept. */
  readonly limit?: number;
}

/** How much of a line or an excerpt an entry carries. */
const LINE_LENGTH = 160;
const EXCERPT_LENGTH = 200;

/** Activities that say nothing a person reads here: comments come from the threads, skipped work is noise. */
const SKIPPED_ACTIONS: ReadonlySet<string> = new Set([
  'comment_added',
  'comment_edited',
  'work_skipped',
  'owner_notified',
]);

const MENTION = /\[@([^\]]*)\]\(mention:\/\/([a-z_-]+)\/([^)]*)\)/gu;
/** Lines the project manager writes for the system rather than for people. */
const META_LINE = /^(?:next|接下来|mode|模式)\s*[:：]/iu;
const REVIEW_STEP = /\breview|评审|审查|复审|审核/iu;
const CHANGES_REQUESTED =
  /changes requested|request(?:s|ed)? changes|needs? (?:changes|fixes)|cannot (?:be )?merged?|can't merge|not ready to merge|do not merge|blocking (?:issue|problem)|需要修改|需修改|不能合并|不可合并|阻塞问题/iu;
const APPROVED =
  /\bapprove[sd]?\b|\blgtm\b|can (?:be )?merged?|ready to merge|looks good to merge|评审通过|审查通过|复审通过|可以合并|可合并|批准合并/iu;

function cut(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

/** A line without Markdown marks, mentions read as their names. */
function plain(line: string): string {
  return line
    .replace(MENTION, (_match, name: string) => name)
    .replace(/^[#>*\-+\s]+/u, '')
    .replace(/[*_`]+/gu, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** The lines of a comment that say something, without the system's own lines. */
function meaningfulLines(content: string, dropMentions: boolean): string[] {
  return content
    .split('\n')
    .map((line) => (dropMentions ? line.replace(MENTION, '') : line))
    .map(plain)
    .filter((line) => line !== '' && !META_LINE.test(line));
}

/** The names of the agents a comment mentions, once each. */
export function mentionedAgents(content: string): string[] {
  const names: string[] = [];
  for (const match of content.matchAll(MENTION))
    if (match[2] === 'agent') {
      const name = (match[1] ?? '').trim() || (match[3] ?? '');
      if (name && !names.includes(name)) names.push(name);
    }
  return names;
}

/** The first meaningful line of a comment, cut to a line's length; null when it says nothing. */
export function firstLine(content: string): string | null {
  const [line] = meaningfulLines(content, false);
  return line ? cut(line, LINE_LENGTH) : null;
}

/** What a review says: approved, changes requested, or neither plainly. */
export function reviewVerdict(
  content: string,
): 'approved' | 'changesRequested' | null {
  if (CHANGES_REQUESTED.test(content)) return 'changesRequested';
  if (APPROVED.test(content)) return 'approved';
  return null;
}

function summarize(
  content: string,
  dropMentions: boolean,
): Pick<FeedEvent, 'summary' | 'excerpt' | 'body'> {
  const lines = meaningfulLines(content, dropMentions);
  const summary = lines[0] ? cut(lines[0], LINE_LENGTH) : null;
  const rest = lines.slice(1).join(' ');
  const excerpt = rest ? cut(rest, EXCERPT_LENGTH) : null;
  const shown = (lines[0] ?? '').length + rest.length;
  const whole = lines.join(' ').length;
  const more =
    (lines[0] ?? '').length > LINE_LENGTH ||
    rest.length > EXCERPT_LENGTH ||
    shown < whole;
  return { summary, excerpt, body: more ? content : null };
}

const blank = {
  summary: null,
  excerpt: null,
  body: null,
  agents: [],
  verdict: null,
  from: null,
  to: null,
  pullRequest: null,
  activity: null,
} as const;

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

export function buildFeed(input: FeedInput): FeedEvent[] {
  const { viewerId, managerId } = input;
  const isMine = (type: string, id: string | null) =>
    viewerId !== null && type === 'user' && id === viewerId;
  const events: FeedEvent[] = [];

  for (const thread of input.threads) {
    const rootHandsOverReview =
      thread.root.authorType === 'agent' &&
      thread.root.authorId === managerId &&
      mentionedAgents(thread.root.content).length > 0 &&
      REVIEW_STEP.test(meaningfulLines(thread.root.content, true).join(' '));
    for (const comment of [thread.root, ...thread.replies]) {
      if (comment.deleted) continue;
      const actor = {
        type: comment.authorType,
        id: comment.authorId,
        name: comment.authorName,
      };
      const base = {
        ...blank,
        id: `comment:${comment.id}`,
        at: comment.createdAt,
        actor,
        mine: isMine(comment.authorType, comment.authorId),
      };
      if (comment.authorType === 'agent' && comment.authorId === managerId) {
        const agents = mentionedAgents(comment.content);
        events.push(
          agents.length > 0
            ? {
                ...base,
                ...summarize(comment.content, true),
                kind: 'handOver',
                agents,
              }
            : {
                ...base,
                ...summarize(comment.content, false),
                kind: 'manager',
              },
        );
        continue;
      }
      if (comment.authorType === 'agent') {
        const verdict =
          comment.id !== thread.root.id && rootHandsOverReview
            ? reviewVerdict(comment.content)
            : null;
        events.push({
          ...base,
          ...summarize(comment.content, false),
          kind: verdict ? 'review' : 'agentReply',
          verdict,
        });
        continue;
      }
      events.push({
        ...base,
        ...summarize(comment.content, false),
        kind: 'comment',
      });
    }
  }

  for (const activity of input.activities) {
    if (SKIPPED_ACTIONS.has(activity.action)) continue;
    const base = {
      ...blank,
      id: `activity:${activity.id}`,
      at: activity.createdAt,
      actor: {
        type: activity.actorType,
        id: activity.actorId,
        name: activity.actorName,
      },
      mine: isMine(activity.actorType, activity.actorId),
    };
    if (activity.action === 'status_changed') {
      events.push({
        ...base,
        kind: 'status',
        from: text(activity.details.from),
        to: text(activity.details.to),
      });
      continue;
    }
    events.push({
      ...base,
      kind: activity.action.startsWith('pr_') ? 'pullRequest' : 'change',
      activity,
    });
  }

  for (const pr of input.pullRequests ?? []) {
    const label = `#${pr.number}`;
    const prEvent = (
      event: 'linked' | 'merged' | 'closed',
      at: string,
    ): FeedEvent => ({
      ...blank,
      id: `pr:${pr.id}:${event}`,
      at,
      kind: 'pullRequest',
      actor: {
        type: pr.linkedBy.type,
        id: pr.linkedBy.id,
        name: event === 'linked' ? pr.linkedBy.name : null,
      },
      mine: event === 'linked' && isMine(pr.linkedBy.type, pr.linkedBy.id),
      pullRequest: { event, label, url: pr.url },
    });
    events.push(prEvent('linked', pr.linkedAt));
    if (pr.mergedAt) events.push(prEvent('merged', pr.mergedAt));
    else if (pr.closedAt) events.push(prEvent('closed', pr.closedAt));
  }

  return events
    .sort(
      (a, b) => Date.parse(b.at) - Date.parse(a.at) || (a.id < b.id ? 1 : -1),
    )
    .slice(0, input.limit ?? 50);
}
