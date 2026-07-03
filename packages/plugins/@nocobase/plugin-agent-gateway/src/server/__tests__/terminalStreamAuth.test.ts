/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { MockServer, createMockServer } from '@nocobase/test';

import { TERMINAL_PROTOCOL, TerminalFrame } from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import { createStreamToken } from '../security';
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

interface StreamTicket {
  ticket: string;
  ticketProof: string;
  authProof?: string;
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
  expect(serialized).not.toContain(ticket.ticketProof);
  if (ticket.authProof) {
    expect(serialized).not.toContain(ticket.authProof);
  }
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
      ticketProofHash: `stale-ticket-proof-hash-${id}`,
      authProofHash: `stale-auth-proof-hash-${id}`,
      runId: values.runId,
      userId: values.userId,
      expiresAt: values.used ? new Date(Date.now() + 60 * 1000) : new Date(Date.now() - 1000),
      usedAt: values.used ? new Date() : null,
      metadataJson: {
        fixture: true,
      },
    },
  });
  return id;
}

async function createLegacyDefaultAuthProofTicketRecord(
  app: MockServer,
  values: { runId: string; userId: string | number },
): Promise<StreamTicket> {
  const id = randomUUID();
  const ticket = createStreamToken();
  const proof = createStreamToken();
  const authProof = createStreamToken();
  await app.db.getRepository('agTerminalStreamTickets').create({
    values: {
      id,
      ticketHash: ticket.tokenHash,
      ticketLast4: ticket.tokenLast4,
      ticketProofHash: proof.tokenHash,
      authProofHash: '',
      runId: values.runId,
      userId: values.userId,
      expiresAt: new Date(Date.now() + 60 * 1000),
      metadataJson: {
        fixture: 'legacy-default-auth-proof',
      },
    },
  });
  return {
    ticket: ticket.token,
    ticketProof: proof.token,
    authProof: authProof.token,
  };
}

async function waitForAudit(app: MockServer, filter: Record<string, unknown>) {
  for (let i = 0; i < 20; i += 1) {
    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter,
    });
    if (audits.length) {
      return audits;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 25);
    });
  }
  return [];
}

async function waitForAuditMatch(
  app: MockServer,
  filter: Record<string, unknown>,
  predicate: (audit: { toJSON(): Record<string, unknown> }) => boolean,
) {
  for (let i = 0; i < 20; i += 1) {
    const audits = await app.db.getRepository('agAgentActionAudits').find({
      filter,
    });
    if (audits.some(predicate)) {
      return audits;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 25);
    });
  }
  return [];
}

describe('terminal stream browser ticket auth', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app?.destroy();
  });

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

  it('accepts a task04-compatible browser subscribe without the additive stream auth proof', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-missing-proof');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket: {
          ...ticket,
          authProof: '',
        },
        requestId: 'subscribe-missing-auth-proof',
      });
      expect(frame).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-missing-auth-proof',
      });
      expectNoTicketMaterial(frame, ticket);
    } finally {
      await server.close();
    }
  });

  it('accepts a task04-compatible browser subscribe without auth proof even when the websocket is authenticated', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-missing-proof-with-header');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket: {
          ...ticket,
          authProof: '',
        },
        requestId: 'subscribe-missing-auth-proof-with-header',
      });
      expect(frame).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-missing-auth-proof-with-header',
      });
      expectNoTicketMaterial(frame, ticket);
    } finally {
      await server.close();
    }
  });

  it('accepts upgraded legacy ticket records with the default empty auth proof hash', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-legacy-empty-proof-hash');
    const userId = await getRootUserId(app);
    const server = await createTerminalStreamServer(app);
    const ticket = await createLegacyDefaultAuthProofTicketRecord(app, { runId, userId });

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket: {
          ...ticket,
          authProof: '',
        },
        requestId: 'subscribe-legacy-empty-auth-proof-hash',
      });
      expect(frame).toMatchObject({
        type: 'ack',
        requestId: 'subscribe-legacy-empty-auth-proof-hash',
      });
      expectNoTicketMaterial(frame, ticket);
      const storedTicket = await app.db.getRepository('agTerminalStreamTickets').findOne({
        filter: {
          ticketLast4: ticket.ticket.slice(-4),
        },
      });
      expect(storedTicket?.get('usedAt')).toBeTruthy();
    } finally {
      await server.close();
    }
  });

  it('rejects upgraded legacy ticket records when a non-empty auth proof cannot be verified', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-legacy-empty-proof-hash-with-proof');
    const userId = await getRootUserId(app);
    const server = await createTerminalStreamServer(app);
    const ticket = await createLegacyDefaultAuthProofTicketRecord(app, { runId, userId });

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket,
        requestId: 'subscribe-legacy-empty-auth-proof-hash-with-proof',
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

  it('rejects tickets with the wrong proof', async () => {
    const runId = await createRun(app, 'terminal-stream-auth-wrong-proof');
    const server = await createTerminalStreamServer(app);
    const ticket = await createBrowserStreamTicket(app, {
      userId: await getRootUserId(app),
      runId,
    });
    const wrongProofTicket = {
      ...ticket,
      ticketProof: 'ag_stream_wrong_proof',
    };

    try {
      const frame = await subscribe({
        serverUrl: server.wsUrl,
        runId,
        ticket: wrongProofTicket,
        requestId: 'subscribe-wrong-proof',
      });
      expect(frame).toMatchObject({
        type: 'error',
        code: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      });
      expectNoTicketMaterial(frame, wrongProofTicket);
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
        authProof: {
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

      const audits = await app.db.getRepository('agAgentActionAudits').find({
        filter: {
          action: 'readTerminal',
          runId,
          resultStatus: 'denied',
        },
      });
      expect(audits.length).toBeGreaterThan(0);
      const serializedAudits = JSON.stringify(audits.map((audit) => audit.toJSON()));
      expect(serializedAudits).not.toContain(ticket.ticket);
      expect(serializedAudits).not.toContain(ticket.ticketProof);
      if (ticket.authProof) {
        expect(serializedAudits).not.toContain(ticket.authProof);
      }
    } finally {
      await server.close();
    }
  });

  it('rejects raw write aliases over websocket and records denied audits', async () => {
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

        const audits = await waitForAuditMatch(
          app,
          {
            action: 'rawTerminalWriteDenied',
            runId,
            resultStatus: 'denied',
          },
          (audit) => {
            const metadata = audit.toJSON().metadataJson as Record<string, unknown>;
            return metadata?.frameType === rawFrameType;
          },
        );
        expect(audits.map((audit) => audit.toJSON())).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              operatorId: userId,
              permissionKey: 'agentGateway.writeTerminalRaw',
              metadataJson: expect.objectContaining({
                code: 'TERMINAL_RAW_WRITE_DISABLED',
                frameType: rawFrameType,
              }),
            }),
          ]),
        );
        expect(JSON.stringify(audits.map((audit) => audit.toJSON()))).not.toContain(secret);
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
      const forgedAudits = await app.db.getRepository('agAgentActionAudits').find({
        filter: {
          action: 'rawTerminalWriteDenied',
          runId: forgedRunId,
        },
      });
      expect(forgedAudits).toHaveLength(0);
      const unboundAudits = await waitForAuditMatch(
        app,
        {
          action: 'rawTerminalWriteDenied',
          resultStatus: 'denied',
        },
        (audit) => {
          const json = audit.toJSON();
          const metadata = json.metadataJson as Record<string, unknown>;
          return json.runId === null && metadata?.subscribedRun === false;
        },
      );
      expect(unboundAudits.map((audit) => audit.toJSON())).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            runId: null,
            operatorId: userId,
            permissionKey: 'agentGateway.writeTerminalRaw',
            metadataJson: expect.objectContaining({
              code: 'TERMINAL_RAW_WRITE_DISABLED',
              frameType: 'browser.input',
              hasRequestedRunId: true,
              subscribedRun: false,
            }),
          }),
        ]),
      );
      expect(JSON.stringify(unboundAudits.map((audit) => audit.toJSON()))).not.toContain(forgedRunId);
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
