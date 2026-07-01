/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  decodeTerminalPayload,
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  claimRun,
  createBrowserToken,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
  createUserWithSnippets,
  createWebSocket,
  sendFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';

describe('terminal stream broker', () => {
  let app: MockServer;
  let rootUserId: string | number;

  beforeEach(async () => {
    app = await createMockServer({
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
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootUserId = rootUser.get('id') as string | number;
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('routes fake daemon terminal data to an authorized browser subscriber', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-1' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-1');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browser = createWebSocket(server.wsUrl, { token: browserToken });

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);

      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-1',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'register-1',
      });

      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-1',
        runId,
        lastOffset: 0,
      });
      expect(await waitForFrame(browser, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'subscribe-1',
      });

      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-1',
        runId,
        sessionName: 'agw_terminal_stream_broker_run_1',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'bind-1',
      });

      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_stream_broker_run_1',
        offsetStart: 0,
        offsetEnd: 29,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('AGENT_GATEWAY_STREAM_SMOKE_1\n'),
        claimToken: 'ag_claim_should_not_forward',
      });

      const dataFrame = await waitForFrame(browser, (frame) => frame.type === 'terminal.data');
      expect(dataFrame).toMatchObject({
        type: 'terminal.data',
        runId,
        offsetStart: 0,
        offsetEnd: 29,
      });
      expect(decodeTerminalPayload(dataFrame.type === 'terminal.data' ? dataFrame.payload : '')).toContain(
        'AGENT_GATEWAY_STREAM_SMOKE_1',
      );
      expect(Object.prototype.hasOwnProperty.call(dataFrame, 'claimToken')).toBe(false);
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('rejects browser subscription without terminal read permission', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-denied' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-denied');
    const server = await createTerminalStreamServer(app);
    const user = await createUserWithSnippets(app, 'terminal-stream-denied', [
      'agentGateway.readRuns',
      'agentGateway.readRunDetails',
    ]);
    const browserToken = await createBrowserToken(app, user.userId, user.roleName);
    const browser = createWebSocket(server.wsUrl, { token: browserToken });

    try {
      await waitForOpen(browser);
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-denied',
        runId,
        lastOffset: 0,
      });

      expect(await waitForFrame(browser, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_PERMISSION_DENIED',
        requestId: 'subscribe-denied',
      });
    } finally {
      browser.close();
      await server.close();
    }
  });

  it('rejects a valid node token when another node owns the active run lease', async () => {
    const owner = await createRunner(app, { nodeKey: 'terminal-stream-owner-node' });
    const attacker = await createRunner(app, { nodeKey: 'terminal-stream-attacker-node' });
    const runId = await createQueuedRun(app, owner, 'terminal-stream-broker-run-cross-node');
    const lease = await claimRun(app, owner, runId);
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: attacker.nodeToken });

    try {
      await waitForOpen(daemon);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-attacker',
        nodeId: attacker.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'register-attacker',
      });

      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-attacker',
        runId,
        sessionName: 'agw_terminal_stream_cross_node',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });

      expect(await waitForFrame(daemon, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_LEASE_LOST',
        requestId: 'bind-attacker',
      });
    } finally {
      daemon.close();
      await server.close();
    }
  });

  it('forwards daemon offset gap errors to the requesting browser subscriber', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-gap' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-gap');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browser = createWebSocket(server.wsUrl, { token: browserToken });

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-gap',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-gap');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-gap',
        runId,
        sessionName: 'agw_terminal_stream_gap',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-gap');

      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-gap',
        runId,
        lastOffset: 42,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-gap');
      const snapshotRequest = await waitForFrame(daemon, (frame) => frame.type === 'daemon.snapshotRequest');
      expect(snapshotRequest).toMatchObject({
        runId,
        fromOffset: 42,
      });

      sendFrame(daemon, {
        type: 'error',
        protocol: TERMINAL_PROTOCOL,
        requestId: snapshotRequest.type === 'daemon.snapshotRequest' ? snapshotRequest.requestId : '',
        code: 'TERMINAL_OFFSET_GAP',
        message: 'Offset is outside daemon ring buffer',
        details: {
          claimToken: lease.claimToken,
        },
      });

      const errorFrame = await waitForFrame(browser, (frame) => frame.type === 'error');
      expect(errorFrame).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
      });
      expect(JSON.stringify(errorFrame)).not.toContain(String(lease.claimToken));
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('keeps a bound websocket stream valid after normal run heartbeat lease renewal', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-heartbeat' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-heartbeat');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browser = createWebSocket(server.wsUrl, { token: browserToken });

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-heartbeat',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-heartbeat');
      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-heartbeat',
        runId,
        lastOffset: 0,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-heartbeat');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-heartbeat',
        runId,
        sessionName: 'agw_terminal_stream_heartbeat',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-heartbeat');

      const heartbeatResponse = await app
        .agent()
        .post(`/api/agent-gateway/nodes/${runner.nodeId}/runs/${runId}/heartbeat`)
        .set('Authorization', `Bearer ${runner.nodeToken}`)
        .send({
          claimToken: lease.claimToken,
          claimAttempt: lease.claimAttempt,
          leaseVersion: lease.leaseVersion,
          status: 'running',
        });
      expect(heartbeatResponse.status).toBe(200);

      sendFrame(daemon, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_stream_heartbeat',
        offsetStart: 0,
        offsetEnd: 29,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload('AGENT_GATEWAY_STREAM_SMOKE_1\n'),
      });

      expect(await waitForFrame(browser, (frame) => frame.type === 'terminal.data')).toMatchObject({
        runId,
        offsetEnd: 29,
      });
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });

  it('rejects reconnect snapshot requests after the bound run lease expires', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-broker-node-expired' });
    const runId = await createQueuedRun(app, runner, 'terminal-stream-broker-run-expired');
    const lease = await claimRun(app, runner, runId);
    const server = await createTerminalStreamServer(app);
    const browserToken = await createBrowserToken(app, rootUserId);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });
    const browser = createWebSocket(server.wsUrl, { token: browserToken });

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browser)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'register-expired',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'register-expired');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'bind-expired',
        runId,
        sessionName: 'agw_terminal_stream_expired',
        startOffset: 0,
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'bind-expired');

      await app.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          claimExpiresAt: new Date(Date.now() - 1000),
        },
      });

      sendFrame(browser, {
        type: 'browser.subscribe',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'subscribe-expired',
        runId,
        lastOffset: 42,
      });
      await waitForFrame(browser, (frame) => frame.type === 'ack' && frame.requestId === 'subscribe-expired');

      expect(await waitForFrame(browser, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_LEASE_LOST',
      });
    } finally {
      daemon.close();
      browser.close();
      await server.close();
    }
  });
});
