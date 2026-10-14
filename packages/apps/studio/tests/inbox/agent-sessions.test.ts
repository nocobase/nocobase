// @vitest-environment node
/**
 * The agent sessions' notices in Studio's inbox (`server/inbox/agent-sessions.ts`): what a 「我的 Agent」 session's agent did
 * while its owner was not looking becomes an information card about the session, merged per session, opening it; and
 * settles for the owner when they see the session, answer the request or archive it.
 */
import { describe, expect, it, vi } from 'vitest';

import type { SessionNotice } from '@nocobase/app-plugin-agent-sessions/server';

import {
  AGENT_SESSIONS_SOURCE,
  agentSessionNotices,
  sessionNoticeToInbox,
} from '../../server/inbox/agent-sessions.js';
import {
  checkInboxSend,
  type StudioInboxPort,
} from '../../server/inbox/port.js';

const asked: SessionNotice = {
  key: 's1:7:permissionRequested',
  type: 'permissionRequested',
  userId: 'alice',
  sessionId: 's1',
  title: 'Fix the board',
  agent: 'Codex',
  detail: 'Run npm test',
  at: '2026-10-13T08:00:00.000Z',
};

function port(): StudioInboxPort {
  return {
    send: vi.fn(() => Promise.resolve()),
    resolve: vi.fn(() => Promise.resolve()),
    withdraw: vi.fn(() => Promise.resolve()),
    settle: vi.fn(() => Promise.resolve()),
  };
}

describe("the agent sessions' notices", () => {
  it('become information about the session, merged per session, opening it', () => {
    expect(checkInboxSend(sessionNoticeToInbox(asked))).toEqual({
      key: 'agent-session:s1:7:permissionRequested',
      source: AGENT_SESSIONS_SOURCE,
      kind: 'info',
      type: 'permissionRequested',
      userIds: ['alice'],
      title: 'Codex is waiting for your permission',
      body: 'Fix the board: Run npm test',
      path: '/agent-sessions/s1',
      subject: { type: 'agentSession', id: 's1', label: 'Fix the board' },
      group: 's1',
      actor: null,
      data: {
        agent: 'Codex',
        session: 'Fix the board',
        detail: 'Run npm test',
      },
    });
  });

  it('label the card with a long title cut to what the inbox keeps', () => {
    const notice = sessionNoticeToInbox({
      ...asked,
      type: 'turnEnded',
      detail: null,
      title: 'x'.repeat(300),
    });
    expect(checkInboxSend(notice).subject?.label).toHaveLength(191);
    expect(notice.body).toBe('x'.repeat(300));
  });

  it('send through the port and settle the owner’s cards about the session', async () => {
    const inbox = port();
    const notices = agentSessionNotices(() => inbox);
    await notices.send(asked);
    await notices.settle({
      userId: 'alice',
      sessionId: 's1',
      types: ['permissionRequested'],
      outcome: 'answered',
    });
    await notices.settle({ userId: 'alice', sessionId: 's1', outcome: 'seen' });
    expect(inbox.send).toHaveBeenCalledWith(sessionNoticeToInbox(asked));
    expect(inbox.settle).toHaveBeenNthCalledWith(1, {
      source: AGENT_SESSIONS_SOURCE,
      subject: { type: 'agentSession', id: 's1' },
      types: ['permissionRequested'],
      userIds: ['alice'],
      outcome: 'answered',
    });
    expect(inbox.settle).toHaveBeenNthCalledWith(2, {
      source: AGENT_SESSIONS_SOURCE,
      subject: { type: 'agentSession', id: 's1' },
      userIds: ['alice'],
      outcome: 'seen',
    });
  });
});
