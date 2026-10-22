import { afterEach, expect, it } from 'vitest';
import { PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());

it('defaults new registrations to four, preserves online settings and reports applied capacity without overwriting settings', async () => {
  h = await createHarness();
  const token = await h.services.runners.createRegistrationToken('owner', {});
  const registered = await h.services.runners.register({
    registrationToken: token.token,
    name: 'capacity-test',
    hostname: 'localhost',
    os: 'linux',
    arch: 'x64',
    version: 'test',
    protocolVersion: PROTOCOL_VERSION,
    features: [],
    tools: [],
    slots: 9,
    toolSlots: { claude: 1 },
  });
  expect(registered.slots).toBe(4);
  expect(registered.toolSlots).toBeUndefined();
  const beat = (slots: number, tools = {}) =>
    h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: registered.runnerKey,
      body: {
        version: 'test',
        features: [],
        tools: [],
        active: [],
        load: { slots, free: 0, tools, capacitySource: 'online' },
      },
    });
  await h.services.runners.update(registered.runnerId, {
    slots: 6,
    toolSlots: { claude: 3 },
  });
  const first = await beat(4);
  expect(first.status).toBe(200);
  expect(first.body.data.capacity).toEqual({
    slots: 6,
    toolSlots: { claude: 3 },
  });
  const reported = await h.services.runners.get(registered.runnerId);
  expect(reported).toMatchObject({
    slots: 6,
    reportedSlots: 4,
    capacitySource: 'online',
  });
  await h.services.runners.update(registered.runnerId, {
    slots: 8,
    toolSlots: null,
  });
  expect((await beat(6)).body.data.capacity).toEqual({
    slots: 8,
    toolSlots: {},
  });
  await beat(8);
  expect(await h.services.runners.get(registered.runnerId)).toMatchObject({
    slots: 8,
    reportedSlots: 8,
    toolSlots: null,
  });
});

it('announces capacity changes without announcing tool free-space changes or map ordering', async () => {
  h = await createHarness();
  const registered = await h.registerRunner();
  const events: string[] = [];
  const stop = h.services.events.onAny((event) => events.push(event.type));
  const beat = (tools: Record<string, { slots: number; free: number }>) =>
    h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: registered.key,
      body: {
        version: '0.0.1',
        features: [],
        tools: [],
        active: [],
        load: { slots: 4, free: 4, tools, capacitySource: 'online' },
      },
    });
  try {
    await beat({ codex: { slots: 2, free: 2 }, claude: { slots: 3, free: 3 } });
    expect(events).toContain('runner.changed');
    events.length = 0;
    await beat({ codex: { slots: 2, free: 1 }, claude: { slots: 3, free: 2 } });
    expect(events).not.toContain('runner.changed');
    await beat({ codex: { slots: 3, free: 1 }, claude: { slots: 3, free: 2 } });
    expect(events).toContain('runner.changed');
  } finally {
    stop();
  }
});
