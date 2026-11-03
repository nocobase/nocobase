import { randomUUID } from 'node:crypto';
import { PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import type { Agents } from '../../server/tokens.js';

/** Issue a real Run credential through registration, enqueue and claim on an isolated host. */
export async function createClaimedRun(agents: Agents, userId: string) {
  const agentId = `fixture-${randomUUID()}`;
  await agents.agents.ensureSystem({
    id: agentId,
    name: 'Offline runner fixture',
    description: null,
    instructions: null,
    actions: [],
    modelEntries: [{ tool: 'claude', model: null }],
  });
  const conversation = await agents.conversations.create(userId, { agentId });
  const registration = await agents.runners.createRegistrationToken(userId, {
    trust: 'ownerOnly',
    slots: 1,
    enabledTools: ['claude'],
  });
  const registered = await agents.runners.register({
    registrationToken: registration.token,
    name: 'Isolated fixture runner',
    hostname: 'fixture',
    os: 'linux',
    arch: 'x64',
    version: '0.0.0-fixture',
    protocolVersion: PROTOCOL_VERSION,
    features: [],
    tools: [{ kind: 'claude', authenticated: true }],
    slots: 1,
  });
  const runner = await agents.runners.authenticate(registered.runnerKey);
  await agents.runners.heartbeat(runner, {
    version: '0.0.0-fixture',
    features: [],
    tools: [{ kind: 'claude', authenticated: true }],
    active: [],
    load: { free: 1, slots: 1 },
  });
  const enqueued = await agents.runs.enqueue({
    agentId,
    subject: { kind: 'conversation', id: conversation.id },
    actorUserId: userId,
    input: {
      type: 'comment',
      actor: { kind: 'user', id: userId, name: 'Fixture' },
      text: 'Offline permission boundary fixture.',
    },
  });
  const payloads = await agents.claims.claim(
    await agents.runners.authenticate(registered.runnerKey),
    1,
  );
  const payload = payloads.find((value) => value.run.id === enqueued.runId);
  if (!payload) throw new Error('Fixture Run was not claimed.');
  return { payload, runner, conversation };
}
