import { afterEach, describe, expect, it, vi } from 'vitest';
import { HEADERS } from '@nocobase/agent-protocol';
import { OnlineAgentCredentials } from '../server/cli/online-credential.js';
import { hashCredential } from '../server/kernel/crypto.js';

afterEach(() => vi.restoreAllMocks());

describe('OnlineAgent credential cleanup', () => {
  it('removes expired entries on issue without scheduling timers or removing live entries', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(100);
    const timeout = vi.spyOn(globalThis, 'setTimeout');
    const credentials = new OnlineAgentCredentials(100);
    const expired = credentials.issue('alice', 'first');
    now.mockReturnValue(150);
    const live = credentials.issue('bob', 'second');
    now.mockReturnValue(200);
    const headers = new Headers({ [HEADERS.runToken]: expired.token });
    expect(() => credentials.resolve(headers)).toThrow();
    expect(credentials['entries'].has(hashCredential(expired.token))).toBe(
      true,
    );

    const next = credentials.issue('alice', 'third');
    expect(timeout).not.toHaveBeenCalled();
    expect(credentials['entries'].has(hashCredential(expired.token))).toBe(
      false,
    );
    expect(credentials['entries'].size).toBe(2);
    expect(
      await credentials.resolve(
        new Headers({ [HEADERS.runToken]: live.token }),
      ),
    ).toMatchObject({ id: 'second' });
    expect(
      await credentials.resolve(
        new Headers({ [HEADERS.runToken]: next.token }),
      ),
    ).toMatchObject({ id: 'third' });
    expired.release();
    expect(credentials['entries'].size).toBe(2);
    live.release();
    next.release();
  });

  it('releases entries immediately and idempotently', () => {
    const credentials = new OnlineAgentCredentials();
    const lease = credentials.issue('alice', 'execution');
    const headers = new Headers({ [HEADERS.runToken]: lease.token });
    lease.release();
    lease.release();
    expect(credentials['entries'].size).toBe(0);
    expect(() => credentials.resolve(headers)).toThrow();
  });
});
