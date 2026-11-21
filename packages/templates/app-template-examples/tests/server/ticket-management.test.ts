import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import type { ManagementDetails, ManagementResult } from '@nocobase/lifecycle';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
  },
});

const json = (body: object): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(body),
});

test('ticket management uses the signed-in administrator, persists its audit, and preserves the conversation', async ({
  testApp,
  request,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const credentials = {
    email: 'ticket-member@example.com',
    password: 'test-member-password',
  };
  const signup = await request(
    '/auth/sign-up/email',
    json({ ...credentials, name: 'Ticket member', username: 'ticketmember' }),
  );
  expect(signup.status).toBe(200);
  const member = await signIn(testApp, credentials);
  const root = '/lifecycleExample/tickets';
  const created = await member.fetch(
    root + '?actAs=customer-li',
    json({
      subject: 'Management integration test',
      description: 'Keep the opening message.',
      category: 'account',
      priority: 'high',
      failNotifications: 0,
    }),
  );
  expect(created.status).toBe(201);
  const {
    data: { id },
  } = (await created.json()) as { data: { id: string } };
  const ticket = root + '/' + id;
  const agent = '?actAs=agent-zhou';
  const customer = '?actAs=customer-li';
  const read = async () => {
    const response = await admin.fetch(ticket + agent);
    expect(response.status).toBe(200);
    return (
      (await response.json()) as {
        data: {
          state: string;
          suspended: boolean;
          roundStartedVersion: number;
          version: number;
          management: ManagementDetails;
          record: {
            assigneeId: string | null;
            closedReason: string | null;
            lifecycleDueAt: string | null;
            description: string;
          };
          history: {
            transitions: { transition: string; input: { message?: string } }[];
          };
        };
      }
    ).data;
  };
  const reply = await admin.fetch(
    ticket + '/fire' + agent,
    json({
      transition: 'reply',
      requestId: 'support-reply',
      input: { message: 'A support reply to keep.' },
    }),
  );
  expect(reply.status).toBe(200);
  const original = await read();
  expect(original.management.actions).toEqual([
    'suspend',
    'reset',
    'restartAt',
  ]);
  const suspend = {
    command: 'suspend',
    reason: 'Review the report.',
    expectedVersion: original.management.version,
    requestId: 'pause-1',
  };
  const manage = (body: object) =>
    admin.fetch(ticket + '/management' + customer, json(body));
  expect((await request(ticket + '/management', json(suspend))).status).toBe(
    401,
  );
  expect(
    (
      await member.fetch(
        ticket + '/management' + agent,
        json({ ...suspend, actor: { id: admin.user.id } }),
      )
    ).status,
  ).toBe(403);
  expect((await manage({ ...suspend, reason: '   ' })).status).toBe(400);
  const [suspended, parallelReplay] = await Promise.all([
    manage(suspend),
    manage(suspend),
  ]);
  expect(suspended.status).toBe(200);
  const first = ((await suspended.json()) as { data: ManagementResult }).data;
  expect(parallelReplay.status).toBe(200);
  expect(await parallelReplay.json()).toEqual({ data: first });
  expect(first).toMatchObject({
    state: 'awaitingCustomer',
    suspended: true,
    round: 1,
  });
  const limited = await member.fetch(ticket + customer);
  expect(limited.status).toBe(200);
  const limitedDetail = await limited.json();
  expect(limitedDetail).toMatchObject({ data: { suspended: true } });
  expect(limitedDetail).not.toHaveProperty('data.management');
  const oldPage = await member.fetch(
    ticket + '/fire' + customer,
    json({
      transition: 'customerReply',
      requestId: 'customer-reply',
      input: { message: 'A stale submission' },
      expectVersion: original.version,
    }),
  );
  expect(oldPage.status).toBe(400);
  expect(await oldPage.json()).toMatchObject({
    error: { reason: 'SUSPENDED' },
  });
  const paused = await read();
  expect(paused.version).toBe(original.version);
  expect(paused.management.actions).toEqual(['resume', 'reset', 'restartAt']);
  expect(paused.management.targets).toEqual([
    'new',
    'open',
    'awaitingCustomer',
    'closed',
  ]);
  expect(paused.management.history[0]).toMatchObject({
    actorId: admin.user.id,
    event: { reason: suspend.reason },
  });
  expect((await manage({ ...suspend, command: 'resume' })).status).toBe(409);
  expect(
    (await manage({ ...suspend, command: 'resume', requestId: 'stale' }))
      .status,
  ).toBe(409);
  const resume = {
    command: 'resume',
    reason: 'Continue the wait.',
    requestId: 'resume-1',
    expectedVersion: paused.management.version,
  };
  expect((await manage(resume)).status).toBe(200);
  expect(await (await manage(suspend)).json()).toEqual({ data: first });
  async function command(
    command: string,
    requestId: string,
    extra = {},
  ): Promise<ManagementResult> {
    const { management } = await read();
    const response = await manage({
      command,
      requestId,
      reason: 'Incident resolved.',
      expectedVersion: management.version,
      ...extra,
    });
    expect(response.status).toBe(200);
    return ((await response.json()) as { data: ManagementResult }).data;
  }
  expect(
    await command('restartAt', 'restart-1', { target: 'open' }),
  ).toMatchObject({ state: 'open', round: 2 });
  expect(
    await command('restartAt', 'restart-closed', { target: 'closed' }),
  ).toMatchObject({ state: 'closed', round: 3 });
  expect((await read()).record).toMatchObject({
    closedReason: 'administrative',
    lifecycleDueAt: null,
  });
  expect(
    await command('restartAt', 'restart-wait', { target: 'awaitingCustomer' }),
  ).toMatchObject({ state: 'awaitingCustomer', round: 4 });
  expect((await read()).record).toMatchObject({
    closedReason: null,
    lifecycleDueAt: expect.any(String),
  });
  expect(
    await command('restartAt', 'restart-new', { target: 'new' }),
  ).toMatchObject({ state: 'new', round: 5 });
  expect(await command('reset', 'reset-1')).toMatchObject({
    state: 'new',
    round: 6,
    recordId: id,
  });
  const detail = await read();
  expect(detail.roundStartedVersion).toBe(detail.version);
  expect(detail.record).toMatchObject({
    assigneeId: null,
    closedReason: null,
    lifecycleDueAt: null,
    description: 'Keep the opening message.',
  });
  expect(detail.management.targets).toEqual(['new', 'closed']);
  const refused = await manage({
    command: 'restartAt',
    target: 'open',
    requestId: 'unassigned',
    reason: 'Cannot route without an assignee.',
    expectedVersion: detail.management.version,
  });
  expect(refused.status).toBe(400);
  expect(detail.history.transitions.map((entry) => entry.transition)).toEqual([
    '$create',
    'reply',
  ]);
  expect(detail.history.transitions.at(-1)?.input.message).toBe(
    'A support reply to keep.',
  );
  expect(detail.management.history.map(({ event }) => event.command)).toEqual([
    'suspend',
    'resume',
    'restartAt',
    'restartAt',
    'restartAt',
    'restartAt',
    'reset',
  ]);
});
