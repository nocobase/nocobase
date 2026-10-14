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
  needsYou: null,
  explanationCommentId: null,
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
  it('PM-297 continues the comment limit instead of asking a question', () => {
    expect(
      askOf(
        t,
        issue(
          'blocked',
          progress({
            state: 'waitingForContinuation',
            needsYou: 'A report was received.',
          }),
        ),
        null,
      ),
    ).toBe('A report was received.');
    expect(
      askOf(
        t,
        issue('in_progress', progress({ state: 'waitingForContinuation' })),
        null,
      ),
    ).toBe('issueLive.ask.continue');
  });
  it.each(['blocked', 'in_review'])(
    'shows the entire structured request and historical fallback for %s',
    (statusKey) => {
      const needsYou =
        'Confirm **this** proposal.\nProvide the URL and choose the region.';
      expect(askOf(t, issue(statusKey, progress({ needsYou })), null)).toBe(
        needsYou,
      );
      expect(
        askOf(
          t,
          issue(
            statusKey,
            progress({
              needsYou,
              state: 'waitingForContinuation',
              waiting: { reason: 'waitingOwner', owner: null },
            }),
          ),
          null,
        ),
      ).toBe(needsYou);
      expect(
        nowLine(
          t,
          issue(statusKey, progress({ explanationCommentId: 'latest' })),
          null,
        ),
      ).toEqual({ text: 'issueLive.ask.legacy', needsViewer: true });
    },
  );
  it('PM-331 hides the old blocked request immediately after leaving Blocked', () => {
    const stale = progress({
      state: 'needsDecision',
      needsYou: 'Restore the disk.',
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
    ).toBe('issueLive.ask.legacy');
  });
  it('covers the selected PR, handoff instance and the structured blocked request regardless of explanation ID', () => {
    const shown = {
      accepting: true,
      handoff: true,
      pullRequest: { repo: 'acme/app', number: 7 },
      notificationKey: 'current',
      blocked: true,
      ownerRequest: true,
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
    ).toBe(true);
  });
});
