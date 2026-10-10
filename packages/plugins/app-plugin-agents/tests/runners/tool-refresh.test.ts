import { afterEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

describe('runner tool status refresh', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });
  it('persists requests until a matching heartbeat reports fresh tools, coalescing retries', async () => {
    h = await createHarness();
    const r = await h.registerRunner({
      features: [],
      toolsRefreshSupported: true,
    });
    const path = `/agents/runners/${r.runnerId}/refreshStatus`;
    const first = await h.request('POST', path, { user: 'owner' });
    expect(first.status).toBe(202);
    const requestId = first.body.data.toolsRefreshRequestId;
    expect(requestId).toEqual(expect.any(String));
    expect(
      (await h.request('POST', path, { user: 'owner' })).body.data
        .toolsRefreshRequestId,
    ).toBe(requestId);
    const heartbeat = {
      version: 'fixture',
      features: [],
      toolsRefreshSupported: true,
      tools: [{ kind: 'claude', authenticated: false }],
      active: [],
      load: { slots: 1, free: 1 },
    };
    const report = (extra = {}) =>
      h.request('POST', '/agents/runners/heartbeat', {
        runnerKey: r.key,
        body: { ...heartbeat, ...extra },
      });
    expect((await report()).body.data.toolsRefreshRequestId).toBe(requestId);
    expect(
      (await report({ toolsRefreshCompletedId: 'stale' })).body.data
        .toolsRefreshRequestId,
    ).toBe(requestId);
    expect(
      (
        await report({
          toolsRefreshCompletedId: requestId,
          tools: [{ kind: 'claude', authenticated: true }],
        })
      ).body.data.toolsRefreshRequestId,
    ).toBeUndefined();
    expect(
      (await h.services.runners.get(r.runnerId)).tools[0]?.authenticated,
    ).toBe(true);
    const next = (await h.request('POST', path, { user: 'owner' })).body.data
      .toolsRefreshRequestId;
    expect(next).not.toBe(requestId);
    expect(
      (await report({ toolsRefreshCompletedId: requestId })).body.data
        .toolsRefreshRequestId,
    ).toBe(next);
  });
  it('requires the owner rights and refuses unsupported and revoked runners', async () => {
    h = await createHarness();
    const r = await h.registerRunner({
      features: [],
      toolsRefreshSupported: true,
    });
    const path = `/agents/runners/${r.runnerId}/refreshStatus`;
    expect((await h.request('POST', path)).status).toBe(401);
    expect(
      (
        await h.request('POST', path, {
          user: 'reader',
          can: ['agents.runners/read'],
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('POST', path, {
          user: 'manager',
          can: ['agents.runners/manage'],
        })
      ).status,
    ).toBe(403);
    const old = await h.registerRunner({ features: [] });
    const unsupported = await h.request(
      'POST',
      `/agents/runners/${old.runnerId}/refreshStatus`,
      { user: 'owner' },
    );
    expect(unsupported.status).toBe(400);
    expect(unsupported.body.error.reason).toBe('TOOLS_REFRESH_UNSUPPORTED');
    await h.services.runners.revoke(r.runnerId);
    expect((await h.request('POST', path, { user: 'owner' })).status).toBe(400);
  });
});
