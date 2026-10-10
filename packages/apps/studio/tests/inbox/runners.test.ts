// @vitest-environment node
/**
 * The agents plugin's runner notices in Studio's inbox (`server/inbox/runners.ts`): a runtime that needs an upgrade becomes an
 * information card for its owner, about the runtime, opening the Runtimes page.
 */
import { describe, expect, it, vi } from 'vitest';

import type {
  AgentsEventBus,
  AgentsNotice,
} from '@nocobase/app-plugin-agents/server/tokens';

import {
  RUNNERS_SOURCE,
  runnersNoticeToInbox,
  bindRunnersNotices,
} from '../../server/inbox/runners.js';
import {
  checkInboxSend,
  type StudioInboxPort,
  type InboxSend,
} from '../../server/inbox/port.js';

const upgrade: AgentsNotice = {
  key: 'runners:runner-upgrade-required:r1:2',
  type: 'runner_upgrade_required',
  userIds: ['alice'],
  subject: { kind: 'runner', id: 'r1', label: 'laptop' },
  title: 'laptop needs an upgrade',
  body: 'This runner speaks agent protocol 2; this application needs 3 to 4.',
  params: {
    runnerName: 'laptop',
    runnerVersion: '0.0.9',
    protocolVersion: 2,
    minProtocolVersion: 3,
    maxProtocolVersion: 4,
    latestVersion: null,
  },
};

describe("the runners' notices", () => {
  it('routes team-only variable notices to runtimes without changing their run subject', () => {
    const notice: AgentsNotice = {
      ...upgrade,
      key: 'run-secrets:run1',
      type: 'run_secrets_not_allowed',
      subject: { kind: 'run', id: 'run1', label: 'run1' },
      params: { variables: 'NPM_TOKEN', runId: 'run1', agentId: 'coder' },
    };
    expect(checkInboxSend(runnersNoticeToInbox(notice))).toMatchObject({
      path: '/runtimes',
      subject: { type: 'run', id: 'run1' },
      type: 'run_secrets_not_allowed',
      data: { variables: 'NPM_TOKEN' },
    });
  });
  it('become an information card about the runtime for its owner', () => {
    const card = runnersNoticeToInbox(upgrade);
    expect(checkInboxSend(card)).toEqual({
      key: upgrade.key,
      source: RUNNERS_SOURCE,
      kind: 'info',
      type: 'runner_upgrade_required',
      userIds: ['alice'],
      title: upgrade.title,
      body: upgrade.body,
      path: '/runtimes',
      subject: { type: 'runner', id: 'r1', label: 'laptop' },
      actor: null,
      data: { ...upgrade.params, subjectId: 'r1' },
    });
  });

  it('are sent through the port as they are announced, settled once they no longer hold, and stop when released', async () => {
    const listeners = new Map<string, (event: { notice: unknown }) => void>();
    const events = {
      on: (type: string, given: (event: { notice: unknown }) => void) => {
        listeners.set(type, given);
        return () => listeners.delete(type);
      },
    } as unknown as Pick<AgentsEventBus, 'on'>;
    const sent: InboxSend[] = [];
    const settle = vi.fn(() => Promise.resolve());
    const port: StudioInboxPort = {
      send: (notice) => {
        sent.push(notice);
        return Promise.resolve();
      },
      resolve: vi.fn(),
      withdraw: vi.fn(),
      settle,
    };
    const release = bindRunnersNotices(events, () => port, vi.fn());
    listeners.get('notice')?.({ notice: upgrade });
    // Nobody to tell: nothing is sent.
    listeners.get('notice')?.({ notice: { ...upgrade, userIds: [] } });
    // A run request's notice is Studio's run requests' to deliver (`server/agents/run-requests.ts`).
    listeners.get('notice')?.({
      notice: {
        ...upgrade,
        key: 'run_request_expired:req1',
        type: 'run_request_expired',
        subject: { kind: 'runRequest', id: 'req1', label: 'coder' },
      },
    });
    await Promise.resolve();
    expect(sent.map((notice) => notice.key)).toEqual([upgrade.key]);
    // The runner upgraded: its owner's card settles.
    listeners.get('notice.cleared')?.({
      notice: { type: upgrade.type, subject: upgrade.subject },
    });
    expect(settle).toHaveBeenCalledWith({
      source: RUNNERS_SOURCE,
      subject: { type: 'runner', id: 'r1' },
      types: ['runner_upgrade_required'],
      outcome: 'upgraded',
    });
    listeners.get('notice.cleared')?.({
      notice: {
        type: 'run_secrets_not_allowed',
        subject: { kind: 'run', id: 'run1' },
      },
    });
    expect(settle).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: 'resumed' }),
    );
    listeners.get('notice.cleared')?.({
      notice: { type: 'futureNotice', subject: { kind: 'run', id: 'run2' } },
    });
    expect(settle).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: 'resolved' }),
    );
    release();
    expect(listeners.size).toBe(0);
  });
});
