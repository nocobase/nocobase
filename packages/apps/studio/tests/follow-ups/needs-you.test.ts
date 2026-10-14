import { describe, expect, it } from 'vitest';
import {
  askOf,
  coveredBySummary,
  nowLine,
} from '../../client/issues/live/summary-model.js';
import type { IssueProgress } from '../../shared/project-manager.js';
import type { InboxEntry } from '../../client/extensions/nocobase-inbox/model.js';
import { GIT_INBOX_SOURCE, PR_MERGE_REQUESTED } from '../../shared/git.js';

const t = (key: string, values?: Record<string, unknown>) =>
  `${key}${values ? JSON.stringify(values) : ''}`;
const progress = (patch: Partial<IssueProgress> = {}): IssueProgress => ({
  state: 'idle',
  agent: null,
  step: null,
  since: null,
  runner: null,
  pullRequest: null,
  question: null,
  next: null,
  handOver: false,
  ...patch,
});
const issue = (statusKey: string, value: IssueProgress) => ({
  owned: true,
  statusKey,
  progress: value,
});
const entry = (
  type: string,
  data: Record<string, string> = {},
  decisionKey: string | null = null,
) =>
  ({ notice: { type, source: GIT_INBOX_SOURCE, data, decisionKey } }) as Pick<
    InboxEntry,
    'notice'
  >;

describe('the shared Needs you text and coverage', () => {
  it('shares personal runner text and hides only the same request from the issue body', () => {
    const pending = progress({
      personalRunnerRequests: [
        {
          id: 'request-1',
          status: 'pending',
          requestedBy: { id: 'bob', name: 'Bob' },
          commentId: 'comment-1',
          commentText: 'Please continue.',
          canDecide: true,
          canRunAsMe: false,
        },
      ],
    });
    expect(askOf(t, issue('in_progress', pending), null)).toBe(
      'issueLive.personalRunner.request{"name":"Bob"}',
    );
    const notice = (id: string) =>
      ({
        notice: {
          source: 'runners',
          type: 'personal_runner_consent',
          data: { requestId: id },
        },
      }) as Pick<InboxEntry, 'notice'>;
    expect(
      coveredBySummary(notice('request-1'), {
        accepting: false,
        handoff: false,
        personalRequestIds: ['request-1'],
      }),
    ).toBe(true);
    expect(
      coveredBySummary(notice('other'), {
        accepting: false,
        handoff: false,
        personalRequestIds: ['request-1'],
      }),
    ).toBe(false);
    const requester = progress({
      personalRunnerRequests: [
        {
          ...pending.personalRunnerRequests![0],
          canDecide: false,
          canRunAsMe: true,
        },
      ],
    });
    expect(
      nowLine(
        t,
        { owned: false, statusKey: 'in_progress', progress: requester },
        null,
      ),
    ).toEqual({ text: 'issueLive.personalRunner.waiting', needsViewer: false });
  });
  it('PM-297 continues the comment limit instead of asking a question', () => {
    expect(
      askOf(
        t,
        issue(
          'blocked',
          progress({
            state: 'waitingForContinuation',
            question: 'A report was received.',
          }),
        ),
        null,
      ),
    ).toBe('issueLive.ask.continue');
    expect(
      askOf(
        t,
        issue('in_progress', progress({ state: 'waitingForContinuation' })),
        null,
      ),
    ).toBe('issueLive.ask.continue');
  });
  it('shows a declared line without calling it a question; a report without a line is only Waiting', () => {
    expect(
      askOf(
        t,
        issue('blocked', progress({ question: 'Confirm **this** proposal.' })),
        null,
      ),
    ).toBe('Confirm this proposal.');
    const waiting = issue(
      'blocked',
      progress({
        blockedComment: {
          id: 'source',
          content: 'Next: wait.\n\nThe read-only report is complete.',
        },
      }),
    );
    expect(nowLine(t, waiting, null)).toEqual({
      text: 'issueLive.ask.waiting{"reason":"The read-only report is complete."}',
      needsViewer: false,
    });
  });
  it('PM-331 hides the old blocked request immediately after leaving Blocked', () => {
    const stale = progress({
      state: 'needsDecision',
      question: 'Restore the disk.',
    });
    expect(askOf(t, issue('in_progress', stale), null)).toBeNull();
    expect(
      coveredBySummary(entry('agent_blocked', { commentId: 'old' }), {
        accepting: false,
        handoff: false,
        blocked: false,
      }),
    ).toBe(true);
    expect(askOf(t, issue('in_progress', progress()), null)).toBeNull();
    expect(
      askOf(
        t,
        issue('done', progress({ state: 'waitingForContinuation' })),
        null,
      ),
    ).toBeNull();
  });
  it('uses the existing handoff and review signals in both lists', () => {
    expect(
      askOf(
        t,
        issue(
          'in_progress',
          progress({ waiting: { reason: 'waitingOwner', owner: null } }),
        ),
        null,
      ),
    ).toBe('issueLive.ask.takeOver');
    expect(
      askOf(t, issue('in_review', progress()), {
        label: 'acme/app#7',
        state: 'open',
      }),
    ).toBe('issueLive.ask.acceptPullRequest{"label":"PR #7"}');
  });
  it('covers only the selected PR, handoff instance and blocked comment', () => {
    const shown = {
      accepting: true,
      handoff: true,
      pullRequest: { repo: 'acme/app', number: 7 },
      notificationKey: 'current',
      blocked: true,
      commentId: 'source',
    };
    expect(
      coveredBySummary(
        entry(PR_MERGE_REQUESTED, { repo: 'acme/app', number: '7' }),
        shown,
      ),
    ).toBe(true);
    expect(
      coveredBySummary(
        entry(PR_MERGE_REQUESTED, { repo: 'acme/app', number: '8' }),
        shown,
      ),
    ).toBe(false);
    expect(
      coveredBySummary(
        entry(PR_MERGE_REQUESTED, { repo: 'other/app', number: '7' }),
        shown,
      ),
    ).toBe(false);
    expect(
      coveredBySummary(
        entry(
          'owner_handoff',
          { notificationKey: 'current' },
          'owner-handoff:current',
        ),
        shown,
      ),
    ).toBe(true);
    expect(
      coveredBySummary(
        entry('owner_handoff', { notificationKey: 'old' }, 'owner-handoff:old'),
        shown,
      ),
    ).toBe(false);
    expect(
      coveredBySummary(entry('agent_blocked', { commentId: 'source' }), shown),
    ).toBe(true);
    expect(
      coveredBySummary(
        entry('agent_blocked', { commentId: 'independent' }),
        shown,
      ),
    ).toBe(false);
  });
});
