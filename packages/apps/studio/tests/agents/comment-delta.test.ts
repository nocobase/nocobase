// @vitest-environment node
/**
 * What an issue run hears of the comments since the agent's last run there: none, the few new ones, or how many and
 * the command that reads them; a fresh session or a first run is told to read the comments instead.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DELTA_INLINE_COMMENTS,
  deltaNotes,
} from '../../server/agents/comment-delta.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

const comment = (id: string, content: string) =>
  ({
    id,
    authorName: 'Bob',
    authorType: 'user',
    content,
    parentId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
  }) as never;
const SINCE = '2026-09-30T00:00:00.000Z';

describe('the comment delta in words', () => {
  it('says nothing new arrived when the delta is empty', () => {
    const notes = deltaNotes(
      { known: true, since: SINCE, comments: [] },
      'PM-1',
      'nb-studio',
    );
    expect(notes.resumed).toBe(
      `No new comments on PM-1 since your last run started (${SINCE}), besides this turn's input.`,
    );
  });

  it('writes a few new comments into the turn', () => {
    const notes = deltaNotes(
      {
        known: true,
        since: SINCE,
        comments: [comment('c1', 'Use v2.'), comment('c2', 'And log it.')],
      },
      'PM-1',
      'nb-studio',
    );
    expect(notes.resumed).toContain('New comments on PM-1');
    expect(notes.resumed).toContain(
      '- Bob at 2026-10-01T00:00:00.000Z [c1]:\n  Use v2.',
    );
    expect(notes.resumed).toContain('And log it.');
    expect(notes.resumed).not.toContain('--since');
  });

  it('gives the count and the command when there are many, or long ones', () => {
    const many = Array.from({ length: DELTA_INLINE_COMMENTS + 1 }, (_, i) =>
      comment(`c${i}`, 'Short.'),
    );
    for (const comments of [many, [comment('long', 'x'.repeat(5000))]]) {
      const notes = deltaNotes(
        { known: true, since: SINCE, comments },
        'PM-1',
        'nb-studio',
      );
      expect(notes.resumed).toBe(
        `${comments.length} new comments on PM-1 since your last run started (${SINCE}). Read them before acting: \`nb-studio issue comment list PM-1 --since ${SINCE}\`.`,
      );
    }
  });

  it('asks a fresh session, or one whose delta is unknown, to read the comments', () => {
    const scan =
      'Before acting, read the comments on PM-1 with `nb-studio issue comment list PM-1`: the context shows only the newest ones, and what you missed since your last run is not known.';
    expect(deltaNotes({ known: false }, 'PM-1', 'nb-studio')).toEqual({
      resumed: scan,
      fresh: scan,
    });
    expect(
      deltaNotes(
        { known: true, since: SINCE, comments: [] },
        'PM-1',
        'nb-studio',
      ).fresh,
    ).toBe(scan);
  });
});

describe('an issue run', () => {
  let h: BridgeHarness;
  beforeEach(async () => {
    h = await createBridgeHarness();
    for (const id of ['alice', 'bob']) await h.addUser(id);
  });
  afterEach(() => h.close());

  const alice = () => h.viewer('alice');

  async function finish(payload: any, sessionId: string) {
    expect(
      (
        await h.runner(RUNNER_ROUTES.start, payload.run.id, {
          workDir: '/tmp/w',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
          summary: 'Done.',
          sessionId,
          handledInputIds: payload.inputs.map(
            (input: { id: string }) => input.id,
          ),
        })
      ).status,
    ).toBe(200);
  }

  async function assigned(): Promise<{ issue: Issue; agentId: string }> {
    await h.createAgent();
    const agentId = PROJECT_MANAGER_ID;
    const issue = await h.projects.issues.create(alice(), {
      title: 'Delta',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: agentId },
    });
    return { issue, agentId };
  }

  it('asks its first run to read the comments, and tells the resumed one what is new', async () => {
    const { issue } = await assigned();
    const first = await h.claimOne();
    expect(first.prompt.turn).toContain(
      `Before acting, read the comments on ${issue.identifier}`,
    );
    await finish(first, 'session-1');
    await h.projects.comments.create(h.viewer('bob'), issue.id, {
      content: 'Background from Bob.',
    });
    await h.projects.comments.create(alice(), issue.id, {
      content: 'Please continue.',
    });
    const next = await h.claimOne();
    expect(next.prompt.session).toBe('resume');
    expect(next.prompt.turn).toContain(
      `New input for issue ${issue.identifier}`,
    );
    expect(next.prompt.turn).toContain('Background from Bob.');
    // Both comments merge into the owner's next run; neither is repeated as news.
    expect(next.prompt.turn.match(/Please continue\./gu)).toHaveLength(1);
  });

  it('says nothing new arrived when only the triggering comment did', async () => {
    const { issue } = await assigned();
    await finish(await h.claimOne(), 'session-1');
    await h.projects.comments.create(alice(), issue.id, {
      content: 'One more thing.',
    });
    const next = await h.claimOne();
    expect(next.prompt.turn).toContain(
      `No new comments on ${issue.identifier} since your last run started`,
    );
  });
});
