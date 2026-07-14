/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { SystemRoleMode, UNION_ROLE_KEY } from '@nocobase/plugin-acl';
import { MockServer, createMockServer } from '@nocobase/test';

import { TERMINAL_PROTOCOL, TerminalFrame } from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  createBrowserStreamTicket,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
  createUserWithSnippets,
  createWebSocket,
  sendFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';

function getTestApiPath(action: Parameters<typeof getAgentGatewayApiUrl>[0], targetKey?: unknown) {
  return `/${getAgentGatewayApiUrl(action, targetKey === undefined ? undefined : String(targetKey))}`;
}

interface StreamTicket {
  ticket: string;
}

async function getRootUserId(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return rootUser?.get('id') as string | number;
}

async function createApp() {
  return await createMockServer({
    plugins: [
      'system-settings',
      'field-sort',
      'users',
      'departments',
      'auth',
      'acl',
      'data-source-manager',
      'error-handler',
      [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
    ],
  });
}

async function createRun(app: MockServer, runCode: string) {
  const runner = await createRunner(app, { nodeKey: `${runCode}-node` });
  return await createQueuedRun(app, runner, runCode);
}

async function createUserWithRoles(
  app: MockServer,
  username: string,
  roleDefinitions: Array<{ name: string; snippets: string[] }>,
) {
  for (const role of roleDefinitions) {
    await app.db.getRepository('roles').create({
      values: role,
    });
  }
  const user = await app.db.getRepository('users').create({
    values: {
      username,
      roles: roleDefinitions.map((role) => role.name),
    },
  });
  return {
    user,
    userId: user.get('id') as string | number,
    roleNames: roleDefinitions.map((role) => role.name),
  };
}

async function subscribe(options: { serverUrl: string; runId: string; ticket: StreamTicket; requestId: string }) {
  const browser = createWebSocket(options.serverUrl, {
    streamTicket: options.ticket,
  });
  try {
    await waitForOpen(browser);
    sendFrame(browser, {
      type: 'browser.subscribe',
      protocol: TERMINAL_PROTOCOL,
      requestId: options.requestId,
      runId: options.runId,
      lastOffset: 0,
    });
    return await waitForFrame(browser, (frame) => frame.type === 'ack' || frame.type === 'error');
  } finally {
    browser.close();
  }
}

async function expireTicket(app: MockServer, ticket: StreamTicket) {
  await app.db.getRepository('agTerminalStreamTickets').update({
    filter: {
      ticketLast4: ticket.ticket.slice(-4),
    },
    values: {
      expiresAt: new Date(Date.now() - 1000),
    },
  });
}

function expectNoTicketMaterial(frame: TerminalFrame, ticket: StreamTicket) {
  const serialized = JSON.stringify(frame);
  expect(serialized).not.toContain(ticket.ticket);
}

async function createStaleTicketRecord(
  app: MockServer,
  values: { runId: string; userId: string | number; used: boolean },
) {
  const id = randomUUID();
  await app.db.getRepository('agTerminalStreamTickets').create({
    values: {
      id,
      ticketHash: `stale-ticket-hash-${id}`,
      ticketLast4: id.slice(-4),
      runId: values.runId,
      userId: values.userId,
      authenticator: 'basic',
      currentRole: 'root',
      currentRoles: ['root'],
      expiresAt: values.used ? new Date(Date.now() + 60 * 1000) : new Date(Date.now() - 1000),
      usedAt: values.used ? new Date() : null,
    },
  });
  return id;
}

describe('terminal stream browser ticket auth', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createApp();
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootAgent = await app.agent().login(rootUser);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function setSystemRoleMode(roleMode: string) {
    const response = await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode,
      },
    });
    expect(response.status).toBe(200);
  }

  async function grantRunScope(roleName: string, scopeName: string, runCode: string) {
    const scopeResponse = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'agRuns',
        name: scopeName,
        scope: {
          runCode,
        },
      },
    });
    expect(scopeResponse.status).toBe(200);
    const roleResourceResponse = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'agRuns',
        usingActionsConfig: true,
        actions: [
          {
            name: 'view',
            scope: scopeResponse.body.data.id,
          },
        ],
      },
    });
    expect(roleResourceResponse.status).toBe(200);
  }

  async function getStoredTicket(ticket: StreamTicket) {
    return await app.db.getRepository('agTerminalStreamTickets').findOne({
      filter: {
        ticketLast4: ticket.ticket.slice(-4),
      },
    });
  }

  it('accepts a valid single-use stream ticket and rejects reuse', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-valid');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });

    try {
      expect(
        await subscribe({
          serverUrl: server.wsUrl,
          runId,
          ticket,
          requestId: 'subscribe-valid',
        }),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-valid',
      });
      const reuseFrame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket,
        requestId: 'subscribe-reuse',
      });
      expect(reuseFrame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      });
      expectNoTicketMaterial(reuseFrame, ticket);
    } finally {
      await server.close();
    }
  });

  it('stores and restores a normal role with only the ticket token exposed', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-normal-role');
    const roleName = 'terminal-stream-normal-role';
    const user = await createUserWithRoles(app, 'terminal-stream-normal-user', [
      {
        name: roleName,
        snippets: ['agentGateway.readTerminal'],
      },
    ]);
    const ticket = await createBrowserStreamTicket(app, {
      userId: user.userId,
      runId,
      roleName,
    });
    const storedTicket = await getStoredTicket(ticket);
    expect(storedTicket?.get('ticketHash')).toBeTruthy();
    expect(storedTicket?.get('ticketLast4')).toBe(ticket.ticket.slice(-4));
    expect(storedTicket?.get('authenticator')).toBe('basic');
    expect(storedTicket?.get('currentRole')).toBe(roleName);
    expect(storedTicket?.get('currentRoles')).toEqual([roleName]);
    expect(JSON.stringify(storedTicket?.toJSON())).not.toContain(ticket.ticket);

    const server = await createTerminalStreamServer(app);
    try {
      expect(
        await subscribe({
          serverUrl: server.wsUrl,
          runId,
          ticket,
          requestId: 'subscribe-normal-role',
        }),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-normal-role',
      });
    } finally {
      await server.close();
    }
  });

  it('preserves allow-use-union role scope across HTTP detail and terminal subscribe', async () => {
    await setSystemRoleMode(SystemRoleMode.allowUseUnion);
    const firstRunCode = 'terminal-stream-union-visible-first';
    const secondRunCode = 'terminal-stream-union-visible-second';
    const firstRunId = await createRun(app, firstRunCode);
    const secondRunId = await createRun(app, secondRunCode);
    const roleNames = ['terminal-stream-union-role-a', 'terminal-stream-union-role-b'];
    const user = await createUserWithRoles(app, 'terminal-stream-union-user', [
      {
        name: roleNames[0],
        snippets: ['agentGateway.readRun', 'agentGateway.readRunDetails', 'agentGateway.readTerminal'],
      },
      {
        name: roleNames[1],
        snippets: ['agentGateway.readRun', 'agentGateway.readRunDetails', 'agentGateway.readTerminal'],
      },
    ]);
    await grantRunScope(roleNames[0], 'terminal-stream-union-scope-a', firstRunCode);
    await grantRunScope(roleNames[1], 'terminal-stream-union-scope-b', secondRunCode);

    const firstRoleAgent = await app.agent().login(user.user, roleNames[0]);
    const firstRoleSecondRunDetail = await firstRoleAgent.get(
      getTestApiPath(AGENT_GATEWAY_API_ACTIONS.getRun, secondRunId),
    );
    expect(firstRoleSecondRunDetail.status).toBe(404);

    const unionAgent = await app.agent().login(user.user, UNION_ROLE_KEY);
    const unionSecondRunDetail = await unionAgent.get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.getRun, secondRunId));
    expect(unionSecondRunDetail.status).toBe(200);
    expect(JSON.stringify(unionSecondRunDetail.body)).toContain(secondRunId);

    const ticket = await createBrowserStreamTicket(app, {
      userId: user.userId,
      runId: secondRunId,
      roleName: UNION_ROLE_KEY,
    });
    const storedTicket = await getStoredTicket(ticket);
    expect(storedTicket?.get('currentRole')).toBe(UNION_ROLE_KEY);
    expect(storedTicket?.get('currentRoles')).toEqual(expect.arrayContaining(roleNames));
    expect(storedTicket?.get('currentRoles')).toHaveLength(roleNames.length);

    const server = await createTerminalStreamServer(app);
    try {
      expect(
        await subscribe({
          serverUrl: server.wsUrl,
          runId: secondRunId,
          ticket,
          requestId: 'subscribe-union-role',
        }),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-union-role',
      });
    } finally {
      await server.close();
    }

    expect(firstRunId).not.toBe(secondRunId);
  });

  it('preserves only-use-union role context without a client-supplied role', async () => {
    await setSystemRoleMode(SystemRoleMode.onlyUseUnion);
    const runId = await createRun(app, 'terminal-stream-only-union');
    const roleNames = ['terminal-stream-only-union-role-a', 'terminal-stream-only-union-role-b'];
    const user = await createUserWithRoles(app, 'terminal-stream-only-union-user', [
      {
        name: roleNames[0],
        snippets: ['agentGateway.readTerminal'],
      },
      {
        name: roleNames[1],
        snippets: ['agentGateway.readTerminal'],
      },
    ]);
    const ticket = await createBrowserStreamTicket(app, {
      userId: user.userId,
      runId,
    });
    const storedTicket = await getStoredTicket(ticket);
    expect(storedTicket?.get('currentRole')).toBe(UNION_ROLE_KEY);
    expect(storedTicket?.get('currentRoles')).toEqual(expect.arrayContaining(roleNames));

    const server = await createTerminalStreamServer(app);
    try {
      expect(
        await subscribe({
          serverUrl: server.wsUrl,
          runId,
          ticket,
          requestId: 'subscribe-only-union-role',
        }),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-only-union-role',
      });
    } finally {
      await server.close();
    }
  });

  it('rejects cross-origin browser stream upgrades without consuming the ticket', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-origin');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const crossOriginBrowser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
      origin: 'https://invalid.agent-gateway.test',
    });

    try {
      await expect(waitForOpen(crossOriginBrowser)).rejects.toThrow(/Unexpected server response: 403/);
      expect(
        await subscribe({
          serverUrl: server.wsUrl,
          runId,
          ticket,
          requestId: 'subscribe-after-cross-origin-denied',
        }),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-after-cross-origin-denied',
      });
    } finally {
      crossOriginBrowser.close();
      await server.close();
    }
  });

  it('allows same-origin browser stream upgrades through a forwarded host proxy', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-forwarded-origin');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const proxiedBrowser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
      origin: 'http://localhost:23000',
      forwardedHost: 'localhost:23000',
    });

    try {
      await waitForOpen(proxiedBrowser);
      sendFrame(proxiedBrowser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-forwarded-origin',
        runId,
        lastOffset: 0,
      });
      expect(
        await waitForFrame(proxiedBrowser, (frame) => frame.type === 'ack' || frame.type === 'error'),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-forwarded-origin',
      });
    } finally {
      proxiedBrowser.close();
      await server.close();
    }
  });

  it('allows same-origin browser stream upgrades through an RFC forwarded host proxy', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-rfc-forwarded-origin');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const proxiedBrowser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
      origin: 'https://gateway.agent-gateway.test',
      forwarded: 'for=127.0.0.1;proto=https;host=gateway.agent-gateway.test',
    });

    try {
      await waitForOpen(proxiedBrowser);
      sendFrame(proxiedBrowser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-rfc-forwarded-origin',
        runId,
        lastOffset: 0,
      });
      expect(
        await waitForFrame(proxiedBrowser, (frame) => frame.type === 'ack' || frame.type === 'error'),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-rfc-forwarded-origin',
      });
    } finally {
      proxiedBrowser.close();
      await server.close();
    }
  });

  it('allows loopback dev proxy browser stream upgrades through forwarded proto and port', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-forwarded-port-origin');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const proxiedBrowser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
      origin: 'http://localhost:23000',
      forwardedPort: '23000',
      forwardedProto: 'http',
    });

    try {
      await waitForOpen(proxiedBrowser);
      sendFrame(proxiedBrowser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-forwarded-port-origin',
        runId,
        lastOffset: 0,
      });
      expect(
        await waitForFrame(proxiedBrowser, (frame) => frame.type === 'ack' || frame.type === 'error'),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-forwarded-port-origin',
      });
    } finally {
      proxiedBrowser.close();
      await server.close();
    }
  });

  it('rejects loopback dev proxy browser stream upgrades when forwarded port does not match origin', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-forwarded-port-mismatch');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const proxiedBrowser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
      origin: 'http://localhost:23000',
      forwardedPort: '23001',
      forwardedProto: 'http',
    });

    try {
      await expect(waitForOpen(proxiedBrowser)).rejects.toThrow(/Unexpected server response: 403/);
      expect(
        await subscribe({
          serverUrl: server.wsUrl,
          runId,
          ticket,
          requestId: 'subscribe-after-forwarded-port-denied',
        }),
      ).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-after-forwarded-port-denied',
      });
    } finally {
      proxiedBrowser.close();
      await server.close();
    }
  });

  it('rejects browser subscribe auth aliases without consuming a valid ticket', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-frame-aliases');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const browser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
    });

    try {
      await waitForOpen(browser);
      for (const field of ['token', 'authToken', 'authorization', 'authenticator', 'role']) {
        const requestId = `subscribe-auth-alias-${field}`;
        sendFrame(browser, {
          type: 'browser.subscribe',
          protocol: TERMINAL_PROTOCOL,
          requestId,
          runId,
          lastOffset: 0,
          [field]: `secret-${field}`,
        });
        const frame = await waitForFrame(
          browser,
          (candidate) => candidate.type === 'error' && candidate.requestId === requestId,
        );
        expect(frame).toMatchObject({
          type: 'error',
          code: 'TERMINAL_PROTOCOL_ERROR',
          requestId,
        });
        expect(JSON.stringify(frame)).not.toContain(`secret-${field}`);
        expectNoTicketMaterial(frame, ticket);
      }

      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-after-auth-alias-rejections',
        runId,
        lastOffset: 0,
      });
      expect(await waitForFrame(browser, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'subscribe-after-auth-alias-rejections',
      });
    } finally {
      browser.close();
      await server.close();
    }
  });

  it('rejects expired tickets with the frozen error code', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-expired');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    await expireTicket(app, ticket);

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket,
        requestId: 'subscribe-expired-ticket',
      });
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_STREAM_TICKET_EXPIRED',
      });
      expectNoTicketMaterial(frame, ticket);
    } finally {
      await server.close();
    }
  });

  it('rejects tickets used for the wrong run', async () => {
    const firstRunId = await createRun(app, 'terminal-stream-auth-run-1');
    const secondRunId = await createRun(app, 'terminal-stream-auth-run-2');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId: firstRunId,
    });

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId: secondRunId,
        ticket,
        requestId: 'subscribe-wrong-run',
      });
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      });
      expectNoTicketMaterial(frame, ticket);
    } finally {
      await server.close();
    }
  });

  it('rejects forged tickets', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-forged-ticket');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const forgedTicket = {
      ...ticket,
      ticket: `${ticket.ticket}-forged`,
    };

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket: forgedTicket,
        requestId: 'subscribe-forged-ticket',
      });
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      });
      expectNoTicketMaterial(frame, forgedTicket);
    } finally {
      await server.close();
    }
  });

  it('ignores unrelated websocket bearer auth and uses the ticket-bound user', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-ticket-bound-user');
    const server = await createTerminalStreamServer(app);
    const ticketOwner = await createUserWithSnippets(app, 'terminal-stream-auth-ticket-owner', [
      'agentGateway.readTerminal',
    ]);
    const ticket = await createBrowserStreamTicket(app, {
      userId: ticketOwner.userId,
      runId,
      roleName: ticketOwner.roleName,
    });
    const otherUser = await createUserWithSnippets(app, 'terminal-stream-auth-other-user', ['agentGateway.readRuns']);

    try {
      const browser = createWebSocket(server.wsUrl, {
        authSession: {
          authToken: 'unrelated-browser-token',
          authenticator: 'basic',
          role: otherUser.roleName,
        },
        streamTicket: ticket,
      });
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-ticket-bound-user',
        runId,
        lastOffset: 0,
      });
      const frame = await waitForFrame(browser, (candidate) => candidate.type === 'ack' || candidate.type === 'error');
      expect(frame).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-ticket-bound-user',
      });
      browser.close();
    } finally {
      await server.close();
    }
  });

  it('rechecks permission at subscribe time and rejects a revoked user', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-revoked');
    const user = await createUserWithSnippets(app, 'terminal-stream-auth-revoked-user', ['agentGateway.readTerminal']);
    const ticket = await createBrowserStreamTicket(app, {
      userId: user.userId,
      runId,
      roleName: user.roleName,
    });
    await app.db.getRepository('roles').update({
      filterByTk: user.roleName,
      values: {
        snippets: ['agentGateway.readRuns'],
      },
    });
    const server = await createTerminalStreamServer(app);

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket,
        requestId: 'subscribe-revoked',
      });
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_PERMISSION_DENIED',
      });
      expectNoTicketMaterial(frame, ticket);
    } finally {
      await server.close();
    }
  });

  it('rejects a ticket after the user is disabled', async () => {
    app.db.getCollection('users').addField('enabled', {
      type: 'boolean',
      allowNull: false,
      defaultValue: true,
    });
    await app.db.sync({ alter: true });
    const runId = await createRun(app, 'terminal-stream-auth-disabled-user');
    const user = await createUserWithSnippets(app, 'terminal-stream-auth-disabled-user', ['agentGateway.readTerminal']);
    const ticket = await createBrowserStreamTicket(app, {
      userId: user.userId,
      runId,
      roleName: user.roleName,
    });
    await app.db.getRepository('users').update({
      filterByTk: user.userId,
      values: {
        enabled: false,
      },
    });
    const server = await createTerminalStreamServer(app);

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket,
        requestId: 'subscribe-disabled-user',
      });
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      });
      expectNoTicketMaterial(frame, ticket);
    } finally {
      await server.close();
    }
  });

  it('rejects raw write aliases over websocket', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-browser-input');
    const userId = await getRootUserId(app);
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId,
      runId,
    });
    const browser = createWebSocket(server.wsUrl, {
      streamTicket: ticket,
    });

    try {
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-browser-input',
        runId,
      });
      expect(await waitForFrame(browser, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'subscribe-browser-input',
      });

      for (const rawFrameType of ['browser.input', 'browser.write', 'terminal.input', 'terminal.write']) {
        const requestId = `${rawFrameType.replace('.', '-')}-denied`;
        const secret = `WS_RAW_SECRET_${rawFrameType.replace('.', '_')}`;
        sendFrame(browser, {
          type: rawFrameType,
          protocol: TERMINAL_PROTOCOL,
          requestId,
          runId,
          input: `password=${secret}`,
        });
        const frame = await waitForFrame(
          browser,
          (nextFrame) => nextFrame.type === 'error' && nextFrame.requestId === requestId,
        );
        expect(frame).toMatchObject({
          type: 'error',
          code: 'TERMINAL_RAW_WRITE_DISABLED',
          requestId,
        });
        expect(JSON.stringify(frame)).not.toContain(secret);
      }

      const forgedRunId = randomUUID();
      sendFrame(browser, {
        type: 'browser.input',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'browser-input-forged-run-denied',
        runId: forgedRunId,
        input: 'password=FORGED_WS_RAW_SECRET',
      });
      const forgedFrame = await waitForFrame(browser, (nextFrame) => nextFrame.type === 'error');
      expect(forgedFrame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_RAW_WRITE_DISABLED',
        requestId: 'browser-input-forged-run-denied',
      });
    } finally {
      browser.close();
      await server.close();
    }
  });

  it('prunes expired and used stream ticket records before creating a new ticket', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-cleanup');
    const userId = await getRootUserId(app);
    const expiredId = await createStaleTicketRecord(app, { runId, userId, used: false });
    const usedId = await createStaleTicketRecord(app, { runId, userId, used: true });

    await createBrowserStreamTicket(app, {
      userId,
      runId,
    });

    await expect(
      app.db.getRepository('agTerminalStreamTickets').findOne({
        filterByTk: expiredId,
      }),
    ).resolves.toBeNull();
    await expect(
      app.db.getRepository('agTerminalStreamTickets').findOne({
        filterByTk: usedId,
      }),
    ).resolves.toBeNull();
  });
});
