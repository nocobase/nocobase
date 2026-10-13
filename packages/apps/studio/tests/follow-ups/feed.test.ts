// @vitest-environment node
/**
 * An issue's activity told by what it means (`client/issues/live/feed.ts`), what "My follow-ups" lists
 * (`client/follow-ups/model.ts`) and what an issue asks of the viewer (`client/issues/live/summary-model.ts`).
 */
import type { CommentThread } from '@nocobase/app-plugin-projects/client/issues';
import type { Activity } from '@nocobase/app-plugin-projects/shared/issues';
import { describe, expect, it } from 'vitest';

import {
  buildFeed,
  firstLine,
  mentionedAgents,
  reviewVerdict,
} from '../../client/issues/live/feed.js';
import { followedIssues, ownedRows } from '../../client/follow-ups/model.js';
import {
  askOf,
  nowLine,
  pullRequestLabel,
} from '../../client/issues/live/summary-model.js';
import type { FollowUpIssue, FollowUpsView } from '../../shared/follow-ups.js';
import type { IssuePullRequest } from '../../shared/git.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';

let sequence = 0;
const at = (minute: number) =>
  new Date(Date.UTC(2026, 9, 12, 13, minute)).toISOString();

function comment(
  author: { type: string; id: string; name?: string },
  content: string,
  minute: number,
  rootId?: string,
) {
  sequence += 1;
  const id = `c${sequence}`;
  return {
    id,
    issueId: 'i1',
    authorType: author.type,
    authorId: author.id,
    authorName: author.name ?? author.id,
    kind: 'comment',
    content,
    note: false,
    parentId: rootId ?? null,
    rootId: rootId ?? id,
    via: null,
    createdAt: at(minute),
    editedAt: null,
    deleted: false,
    reactions: [],
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    attachments: [],
  };
}

function activity(
  action: string,
  minute: number,
  details: Record<string, unknown> = {},
  actor: { type: string; id: string | null } = { type: 'user', id: 'bob' },
): Activity {
  sequence += 1;
  return {
    id: `a${sequence}`,
    actorType: actor.type,
    actorId: actor.id,
    actorName: actor.id,
    action,
    details,
    via: null,
    createdAt: at(minute),
  };
}

const manager = { type: 'agent', id: PROJECT_MANAGER_ID, name: 'PM' };
const sol = { type: 'agent', id: 'sol', name: 'Sol' };
const opus = { type: 'agent', id: 'opus', name: 'Opus' };

describe('the activity feed', () => {
  it('tells hand-overs, replies, reviews, the viewer’s own comments and status moves, newest first', () => {
    const implement = comment(
      manager,
      'Next: once Sol replies, hand the PR to a reviewer.\n\n[@Sol](mention://agent/sol) Implement the five expectations of the issue and open a PR.\nMode: read-only',
      1,
    );
    const reply = comment(
      sol,
      'Pushed and opened PR #10777.\n\nAll three retry entry points now check the same thing.',
      20,
      implement.id,
    );
    const review = comment(
      manager,
      'Next: fix what the review finds.\n[@Opus](mention://agent/opus) Review PR #10777.',
      21,
    );
    const verdict = comment(
      opus,
      'Changes requested: 1 high priority problem.',
      22,
      review.id,
    );
    const mine = comment({ type: 'user', id: 'alice' }, 'Ship it.', 30);
    const threads = [
      { root: implement, replies: [reply] },
      { root: review, replies: [verdict] },
      { root: mine, replies: [] },
    ] as unknown as CommentThread[];
    const pr = {
      id: 'pr1',
      number: 10777,
      url: 'https://github.com/o/r/pull/10777',
      linkedAt: at(19),
      mergedAt: null,
      closedAt: null,
      linkedBy: { type: 'agent', id: 'sol', name: 'Sol' },
    } as unknown as IssuePullRequest;

    const feed = buildFeed({
      activities: [
        activity('comment_added', 30),
        activity('work_skipped', 31, {}, manager),
        activity('status_changed', 25, {
          from: 'in_progress',
          to: 'in_review',
        }),
        activity('labels_changed', 26),
      ],
      threads,
      pullRequests: [pr],
      viewerId: 'alice',
      managerId: PROJECT_MANAGER_ID,
    });

    expect(feed.map((event) => event.kind)).toEqual([
      'comment',
      'change',
      'status',
      'review',
      'handOver',
      'agentReply',
      'pullRequest',
      'handOver',
    ]);
    const [own, , status, judged, , replied, linked, handOver] = feed;
    expect(own).toMatchObject({ mine: true, summary: 'Ship it.' });
    expect(status).toMatchObject({ from: 'in_progress', to: 'in_review' });
    expect(judged).toMatchObject({ verdict: 'changesRequested' });
    expect(replied).toMatchObject({
      summary: 'Pushed and opened PR #10777.',
      excerpt: 'All three retry entry points now check the same thing.',
    });
    expect(linked?.pullRequest).toEqual({
      event: 'linked',
      label: '#10777',
      url: 'https://github.com/o/r/pull/10777',
    });
    expect(handOver).toMatchObject({
      agents: ['Sol'],
      summary: 'Implement the five expectations of the issue and open a PR.',
      excerpt: null,
    });
  });

  it('keeps the whole of a long comment to show on request', () => {
    const long = `${'A finding. '.repeat(30)}\n\n${'More detail. '.repeat(30)}`;
    const [event] = buildFeed({
      activities: [],
      threads: [
        { root: comment(sol, long, 1), replies: [] },
      ] as unknown as CommentThread[],
      viewerId: null,
      managerId: PROJECT_MANAGER_ID,
    });
    expect(event?.summary?.endsWith('…')).toBe(true);
    expect(event?.body).toBe(long);
  });

  it('reads mentions, first lines and review verdicts', () => {
    expect(
      mentionedAgents(
        '[@Sol](mention://agent/sol) and [@Sol](mention://agent/sol), [@Bob](mention://user/bob)',
      ),
    ).toEqual(['Sol']);
    expect(firstLine('接下来：等你验收。\n\n**改动**已就绪。')).toBe(
      '改动已就绪。',
    );
    expect(reviewVerdict('Looks fine. Approved, it can merge.')).toBe(
      'approved',
    );
    expect(reviewVerdict('需要修改：强制合并会绕过必需检查。')).toBe(
      'changesRequested',
    );
    expect(reviewVerdict('评审通过，可以合并。')).toBe('approved');
    expect(reviewVerdict('lint、typecheck、测试通过。')).toBeNull();
  });
});

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;

function issue(overrides: Partial<FollowUpIssue>): FollowUpIssue {
  return {
    id: 'i',
    identifier: 'WEB-1',
    title: 'An issue',
    statusKey: 'in_progress',
    projectId: null,
    executorName: null,
    lastActivityAt: at(0),
    owned: true,
    followed: false,
    progress: null,
    unread: 0,
    seenAt: null,
    ...overrides,
  };
}

describe('what the page lists', () => {
  const view: FollowUpsView = {
    following: ['f', 'b1'],
    followingStored: true,
    counts: { in_review: 1, blocked: 1, in_progress: 2, backlog: 1 },
    truncated: false,
    issues: [
      issue({
        id: 'p1',
        identifier: 'WEB-3',
        statusKey: 'in_progress',
        lastActivityAt: at(5),
      }),
      issue({
        id: 'b1',
        identifier: 'WEB-4',
        statusKey: 'blocked',
        lastActivityAt: at(1),
        title: 'Mail adapter',
      }),
      issue({
        id: 'r1',
        identifier: 'WEB-5',
        statusKey: 'in_review',
        lastActivityAt: at(2),
      }),
      issue({
        id: 'p2',
        identifier: 'WEB-6',
        statusKey: 'in_progress',
        lastActivityAt: at(9),
      }),
      issue({ id: 'k1', identifier: 'WEB-7', statusKey: 'backlog' }),
      issue({ id: 'f', identifier: 'WEB-8', owned: false, followed: true }),
    ],
  };

  it('orders the selected statuses by what needs the viewer first, then by activity', () => {
    expect(
      ownedRows(view, ['in_progress', 'blocked', 'in_review'], '').map(
        (row) => row.id,
      ),
    ).toEqual(['r1', 'b1', 'p2', 'p1']);
    expect(ownedRows(view, ['in_review'], '').map((row) => row.id)).toEqual([
      'r1',
    ]);
    // None selected reads as every status; issues the viewer does not own never appear.
    expect(ownedRows(view, [], '').map((row) => row.id)).toEqual([
      'r1',
      'b1',
      'p2',
      'p1',
      'k1',
    ]);
    expect(ownedRows(view, [], 'mail').map((row) => row.id)).toEqual(['b1']);
    expect(ownedRows(view, [], 'web-6').map((row) => row.id)).toEqual(['p2']);
  });

  it('keeps the followed issues in the order chosen', () => {
    expect(followedIssues(view).map((row) => row.id)).toEqual(['f', 'b1']);
  });

  it('asks the owner to accept or answer, and says what is going on otherwise', () => {
    const mark = { label: 'nocobase/nocobase#10662', state: 'open' } as const;
    expect(pullRequestLabel(mark)).toBe('PR #10662');
    expect(askOf(t, issue({ statusKey: 'in_review' }), mark)).toBe(
      'issueLive.ask.acceptPullRequest {"label":"PR #10662"}',
    );
    expect(askOf(t, issue({ statusKey: 'in_review' }), null)).toBe(
      'issueLive.ask.acceptIssue',
    );
    const progress = {
      state: 'needsDecision' as const,
      agent: null,
      step: null,
      since: null,
      runner: null,
      pullRequest: null,
      question: 'Push again?',
      next: null,
      handOver: false,
    };
    expect(askOf(t, issue({ statusKey: 'blocked', progress }), null)).toBe(
      'issueLive.ask.answer {"question":"Push again?"}',
    );
    expect(
      askOf(t, issue({ statusKey: 'blocked', owned: false, progress }), null),
    ).toBeNull();
    expect(
      nowLine(t, issue({ statusKey: 'blocked', owned: false, progress }), null),
    ).toEqual({
      text: 'issueProgress.needsDecision {"question":"Push again?"}',
      needsViewer: false,
    });
    expect(nowLine(t, issue({ statusKey: 'backlog' }), null)).toBeNull();
  });
});
