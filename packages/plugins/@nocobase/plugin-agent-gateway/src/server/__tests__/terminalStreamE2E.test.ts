/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import WebSocket from 'ws';

import { DaemonTerminalStreamClient } from '../../daemon/terminalStreamClient';
import { TerminalRingBuffer } from '../../daemon/terminalRingBuffer';
import {
  TERMINAL_DAEMON_TARGET_CHUNK_BYTES,
  TerminalFrame,
  decodeTerminalPayload,
  getTerminalPayloadByteLength,
} from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  claimRun,
  createBrowserWebSocketWithTicket,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
  sendBrowserSubscribeFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';

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

async function getRootUserId(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return rootUser?.get('id') as string | number;
}

async function getTerminalLastActivityAt(app: MockServer, runId: string) {
  const run = await app.db.getRepository('agRuns').findOne({
    filterByTk: runId,
  });
  return run?.get('terminalLastActivityAt') as Date | string | null | undefined;
}

async function subscribe(
  app: MockServer,
  serverUrl: string,
  options: { userId: string | number; runId: string; requestId: string; lastOffset?: number },
) {
  const { browser, ticket } = await createBrowserWebSocketWithTicket(app, serverUrl, {
    userId: options.userId,
    runId: options.runId,
  });
  await waitForOpen(browser);
  sendBrowserSubscribeFrame(browser, ticket, {
    runId: options.runId,
    requestId: options.requestId,
    lastOffset: options.lastOffset,
  });
  expect(
    await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === options.requestId),
  ).toMatchObject({
    requestId: options.requestId,
  });
  return browser;
}

async function createStream(
  app: MockServer,
  options: { runCode: string; maxBytes?: number; maxSnapshotBytes?: number },
) {
  const runner = await createRunner(app, { nodeKey: `${options.runCode}-node`, maxConcurrency: 4 });
  const runId = await createQueuedRun(app, runner, options.runCode);
  const lease = await claimRun(app, runner, runId);
  const sessionName = `agw_${options.runCode}`;
  return {
    runId,
    sessionName,
    createClient(serverUrl: string) {
      return new DaemonTerminalStreamClient({
        serverUrl,
        nodeId: runner.nodeId,
        nodeToken: runner.nodeToken,
        runId,
        sessionName,
        ringBuffer: new TerminalRingBuffer({
          runId,
          sessionName,
          maxBytes: options.maxBytes,
          maxSnapshotBytes: options.maxSnapshotBytes,
        }),
        getLease: () => lease,
      });
    },
    runner,
    lease,
  };
}

describe('terminal stream end-to-end reliability', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('recovers a reconnecting browser from the latest consumed offset without duplicate output', async () => {
    const server = await createTerminalStreamServer(app);
    const setup = await createStream(app, { runCode: 'terminal-stream-e2e-reconnect' });
    const stream = setup.createClient(server.serverUrl);
    const rootUserId = await getRootUserId(app);
    let firstBrowser: WebSocket | undefined;

    try {
      await stream.start();
      firstBrowser = await subscribe(app, server.wsUrl, {
        userId: rootUserId,
        runId: setup.runId,
        requestId: 'subscribe-e2e-first',
      });
      await stream.appendText('first line\n');
      const firstData = await waitForFrame(firstBrowser, (frame) => frame.type === 'terminal.data');
      await expect(getTerminalLastActivityAt(app, setup.runId)).resolves.toBeTruthy();
      const consumedOffset = firstData.type === 'terminal.data' ? firstData.offsetEnd : 0;
      firstBrowser.close();

      await stream.appendText('second line\n');
      let secondBrowser: WebSocket | undefined;
      try {
        secondBrowser = await subscribe(app, server.wsUrl, {
          userId: rootUserId,
          runId: setup.runId,
          requestId: 'subscribe-e2e-reconnect',
          lastOffset: consumedOffset,
        });
        const snapshot = await waitForFrame(secondBrowser, (frame) => frame.type === 'terminal.snapshot');
        expect(snapshot).toMatchObject({
          offsetStart: consumedOffset,
        });
        expect(decodeTerminalPayload(snapshot.type === 'terminal.snapshot' ? snapshot.payload : '')).toBe(
          'second line\n',
        );
      } finally {
        secondBrowser?.close();
      }
    } finally {
      stream.close();
      firstBrowser?.close();
      await server.close();
    }
  });

  it('splits large daemon output into deterministic 32 KiB terminal.data frames', async () => {
    const server = await createTerminalStreamServer(app);
    const setup = await createStream(app, { runCode: 'terminal-stream-e2e-large-output' });
    const stream = setup.createClient(server.serverUrl);
    let browser: WebSocket | undefined;
    const largeOutput = 'L'.repeat(TERMINAL_DAEMON_TARGET_CHUNK_BYTES * 3 + 17);
    const frames: TerminalFrame[] = [];

    try {
      await stream.start();
      browser = await subscribe(app, server.wsUrl, {
        userId: await getRootUserId(app),
        runId: setup.runId,
        requestId: 'subscribe-e2e-large',
      });
      await stream.appendText(largeOutput);
      while (
        frames.reduce(
          (sum, frame) => sum + (frame.type === 'terminal.data' ? getTerminalPayloadByteLength(frame.payload) : 0),
          0,
        ) < largeOutput.length
      ) {
        frames.push(await waitForFrame(browser, (frame) => frame.type === 'terminal.data'));
      }
      expect(frames).toHaveLength(4);
      for (const frame of frames) {
        expect(frame.type).toBe('terminal.data');
        if (frame.type === 'terminal.data') {
          expect(getTerminalPayloadByteLength(frame.payload)).toBeLessThanOrEqual(TERMINAL_DAEMON_TARGET_CHUNK_BYTES);
        }
      }
      expect(
        frames.map((frame) => (frame.type === 'terminal.data' ? decodeTerminalPayload(frame.payload) : '')).join(''),
      ).toBe(largeOutput);
    } finally {
      stream.close();
      browser?.close();
      await server.close();
    }
  });

  it('surfaces TERMINAL_OFFSET_GAP when requested bytes have fallen out of daemon retention', async () => {
    const server = await createTerminalStreamServer(app);
    const setup = await createStream(app, {
      runCode: 'terminal-stream-e2e-offset-gap',
      maxBytes: 8,
      maxSnapshotBytes: 8,
    });
    const stream = setup.createClient(server.serverUrl);
    let browser: WebSocket | undefined;

    try {
      await stream.start();
      await stream.appendText('0123456789abcdef');
      browser = await subscribe(app, server.wsUrl, {
        userId: await getRootUserId(app),
        runId: setup.runId,
        requestId: 'subscribe-e2e-gap',
        lastOffset: 0,
      });
      expect(await waitForFrame(browser, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
      });
    } finally {
      stream.close();
      browser?.close();
      await server.close();
    }
  });
});
