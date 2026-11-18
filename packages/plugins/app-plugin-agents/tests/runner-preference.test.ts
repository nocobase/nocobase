/**
 * The kind of runner a person's runs go to first: kept with their chat preferences, noted on each run they queue, and
 * turned into one more second of waiting for runners of the other kind (`preferenceDelay`). The waits themselves are
 * in `claim-pacing.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { preferenceDelay } from '../server/core/runs/claim.js';
import { createHarness, type Harness } from './harness.js';

const TEAM = { trust: 'team' } as const;
const PERSONAL = { trust: 'ownerOnly' } as const;

describe('preferenceDelay', () => {
  const run = (
    runnerPreference: string | null,
    extra: { runnerPinId?: string; teamOnlyVariables?: unknown } = {},
  ) => ({
    runnerPreference,
    runnerPinId: extra.runnerPinId ?? null,
    teamOnlyVariables: (extra.teamOnlyVariables ?? null) as never,
  });

  it('makes only the kind the run does not prefer wait a second', () => {
    expect(preferenceDelay(TEAM, run('personal'), false)).toBe(1000);
    expect(preferenceDelay(PERSONAL, run('personal'), false)).toBe(0);
    expect(preferenceDelay(PERSONAL, run('team'), false)).toBe(1000);
    expect(preferenceDelay(TEAM, run('team'), false)).toBe(0);
    expect(preferenceDelay(TEAM, run(null), false)).toBe(0);
    expect(preferenceDelay(PERSONAL, run(null), false)).toBe(0);
  });

  it('adds nothing to work only this runner may take', () => {
    expect(preferenceDelay(TEAM, run('personal'), true)).toBe(0);
    expect(
      preferenceDelay(TEAM, run('personal', { runnerPinId: 'r1' }), false),
    ).toBe(0);
  });

  it('adds nothing for a shared runner when the run has variables for shared runners only', () => {
    expect(
      preferenceDelay(
        TEAM,
        run('personal', {
          teamOnlyVariables: [{ scope: 'agent', scopeId: 'a1', name: 'TOKEN' }],
        }),
        false,
      ),
    ).toBe(0);
  });
});

describe('the runner preference', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  async function stored(runId: string) {
    const row = await h!.database
      .connection()
      .repository<{ id: string; runnerPreference: string | null }>('agRuns')
      .findOne({ filter: { id: runId } });
    return row?.runnerPreference ?? null;
  }

  it('is the caller’s own, auto until chosen, and only takes the three values', async () => {
    h = await createHarness();
    const read = await h.request('GET', '/agents/chatPreferences', {
      user: 'alice',
    });
    expect(read.body.data).toEqual({
      defaultAgentId: null,
      runnerPreference: 'auto',
    });
    const saved = await h.request('PATCH', '/agents/chatPreferences', {
      user: 'alice',
      body: { runnerPreference: 'personal' },
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.runnerPreference).toBe('personal');
    expect(
      (await h.request('GET', '/agents/chatPreferences', { user: 'alice' }))
        .body.data.runnerPreference,
    ).toBe('personal');
    expect(
      (await h.request('GET', '/agents/chatPreferences', { user: 'bob' })).body
        .data.runnerPreference,
    ).toBe('auto');
    const invalid = await h.request('PATCH', '/agents/chatPreferences', {
      user: 'alice',
      body: { runnerPreference: 'only-personal' },
    });
    expect(invalid.status).toBe(400);
    // Changing the default agent keeps the runner preference.
    await h.request('PATCH', '/agents/chatPreferences', {
      user: 'alice',
      body: { defaultAgentId: null },
    });
    expect(
      (await h.request('GET', '/agents/chatPreferences', { user: 'alice' }))
        .body.data.runnerPreference,
    ).toBe('personal');
    await h.request('PATCH', '/agents/chatPreferences', {
      user: 'alice',
      body: { runnerPreference: 'auto' },
    });
    expect(
      (await h.request('GET', '/agents/chatPreferences', { user: 'alice' }))
        .body.data.runnerPreference,
    ).toBe('auto');
  });

  it('is noted on each run its actor queues, as it was then', async () => {
    h = await createHarness();
    const agent = await h.createAgent({ maxConcurrentRuns: 8 });
    const before = await h.enqueue(agent, '1');
    await h.services.chat.updatePreferences('owner', {
      runnerPreference: 'team',
    });
    const after = await h.enqueue(agent, '2');
    const other = await h.enqueue(agent, '3', { actorUserId: 'bob' });
    expect(await stored(before)).toBeNull();
    expect(await stored(after)).toBe('team');
    expect(await stored(other)).toBeNull();
  });
});
