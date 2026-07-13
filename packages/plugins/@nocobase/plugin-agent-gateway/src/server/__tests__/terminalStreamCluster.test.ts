/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { MockCluster, MockServer, createMockCluster } from '@nocobase/test';
import WebSocket from 'ws';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';
import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import {
  TERMINAL_PAYLOAD_ENCODING,
  TERMINAL_PROTOCOL,
  TerminalFrame,
  decodeTerminalPayload,
  encodeTerminalPayload,
} from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  TerminalStreamTransport,
  TerminalStreamTransportDirection,
  TerminalStreamTransportEvent,
  TerminalStreamTransportListener,
} from '../services/terminalStreamTransport';
import {
  claimRun,
  createBrowserStreamTicket,
  createQueuedRun,
  createRunner,
  createTerminalStreamServer,
  createWebSocket,
  sendFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';

interface ResponseLike {
  status: number;
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function getTestApiPath(action: Parameters<typeof getAgentGatewayApiUrl>[0], targetKey?: string | number) {
  return `/${getAgentGatewayApiUrl(action, targetKey)}`;
}

function waitForNoFrame(ws: WebSocket, predicate: (frame: TerminalFrame) => boolean, durationMs: number) {
  return new Promise<boolean>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      resolve(false);
    }, durationMs);
    const onMessage = (data: WebSocket.RawData) => {
      try {
        const frame = JSON.parse(data.toString()) as TerminalFrame;
        if (!predicate(frame)) {
          return;
        }
        clearTimeout(timer);
        ws.off('message', onMessage);
        resolve(true);
      } catch (error) {
        clearTimeout(timer);
        ws.off('message', onMessage);
        reject(error);
      }
    };
    ws.on('message', onMessage);
  });
}

function sendBrowserSubscribe(ws: WebSocket, options: { runId: string; requestId: string; lastOffset?: number }) {
  sendFrame(ws, {
    type: 'browser.subscribe',
    protocol: TERMINAL_PROTOCOL,
    requestId: options.requestId,
    runId: options.runId,
    lastOffset: options.lastOffset,
  });
}

class ControllableSharedTerminalTransport implements TerminalStreamTransport {
  private readonly listeners = new Map<string, Set<TerminalStreamTransportListener>>();
  connected = true;
  duplicateNextDaemonFrame = false;

  private getChannel(runId: string, direction: TerminalStreamTransportDirection) {
    return `${runId}:${direction}`;
  }

  async subscribe(
    runId: string,
    direction: TerminalStreamTransportDirection,
    listener: TerminalStreamTransportListener,
  ) {
    const channel = this.getChannel(runId, direction);
    const listeners = this.listeners.get(channel) || new Set<TerminalStreamTransportListener>();
    listeners.add(listener);
    this.listeners.set(channel, listeners);
    return async () => {
      listeners.delete(listener);
      if (!listeners.size) {
        this.listeners.delete(channel);
      }
    };
  }

  async publish(runId: string, direction: TerminalStreamTransportDirection, event: TerminalStreamTransportEvent) {
    if (!this.connected) {
      throw new Error('Shared terminal transport is temporarily unavailable');
    }
    const listeners = Array.from(this.listeners.get(this.getChannel(runId, direction)) || []);
    const deliveryCount =
      direction === 'daemon-to-browser' && event.type === 'daemon.frame' && this.duplicateNextDaemonFrame ? 2 : 1;
    this.duplicateNextDaemonFrame = false;
    for (let deliveryIndex = 0; deliveryIndex < deliveryCount; deliveryIndex += 1) {
      for (const listener of listeners) {
        await listener(event);
      }
    }
  }

  async isShared() {
    return this.connected;
  }

  async close() {
    // Brokers own their unsubscribe handles; the shared test transport outlives each endpoint.
  }
}

describe('agent gateway terminal stream cluster behavior', () => {
  let cluster: MockCluster;
  let instanceA: MockServer;
  let instanceB: MockServer;
  let rootUserId: string | number;
  let rootAgentB: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    cluster = await createMockCluster({
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
    [instanceA, instanceB] = cluster.nodes;
    const rootUser = await instanceB.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootUserId = rootUser.get('id') as string | number;
    rootAgentB = await instanceB.agent().login(rootUser);
  });

  afterEach(async () => {
    await cluster?.destroy();
  });

  it('delivers interrupt and terminate control requests across instances through shared durable state', async () => {
    const runner = await createRunner(instanceA, {
      nodeKey: `terminal-control-cluster-${randomUUID()}`,
      terminalControl: true,
    });
    const runId = await createQueuedRun(instanceA, runner, `terminal-control-cluster-run-${randomUUID()}`);
    await instanceA.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        provider: 'codex',
        executionPolicyKey: 'fake-success',
        capabilitiesSnapshotJson: normalizeAgentProviderCapabilities('codex', {
          interrupt: true,
          terminate: true,
        }),
      },
    });
    const claim = await claimRun(instanceA, runner, runId);
    const leaseBody = {
      claimToken: claim.claimToken,
      claimAttempt: claim.claimAttempt,
      leaseVersion: claim.leaseVersion,
    };
    const nodeAgentA = instanceA.agent().set('Authorization', `Bearer ${runner.nodeToken}`);
    const terminalResponse = await nodeAgentA
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.updateRunTerminal, runId))
      .send({
        ...leaseBody,
        terminalBackend: 'tmux',
        terminalSessionName: `ag-run-${runId}`,
        terminalStatus: 'active',
      });
    expect(terminalResponse.status).toBe(200);

    for (const action of ['interrupt', 'terminate'] as const) {
      const actionResponse = await rootAgentB
        .post(
          getTestApiPath(
            action === 'interrupt'
              ? AGENT_GATEWAY_API_ACTIONS.interruptTerminal
              : AGENT_GATEWAY_API_ACTIONS.terminateTerminal,
            runId,
          ),
        )
        .send({
          reason: `${action} from instance B`,
          idempotencyKey: `${action}-cluster-${randomUUID()}`,
        });
      expect(actionResponse.status).toBe(200);
      const controlRequestId = String(getData(actionResponse).controlRequestId);
      expect(controlRequestId).toBeTruthy();

      const pendingResponse = await nodeAgentA
        .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests, runId))
        .send(leaseBody);
      expect(pendingResponse.status).toBe(200);
      const request = (getData(pendingResponse).requests as Record<string, unknown>[]).find(
        (item) => String(item.id) === controlRequestId,
      );
      expect(request).toMatchObject({
        id: controlRequestId,
        action,
        status: 'accepted',
      });

      expect(
        (
          await nodeAgentA.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.ackControlRequest, runId)).send({
            ...leaseBody,
            requestId: controlRequestId,
            status: 'delivered',
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await nodeAgentA.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.ackControlRequest, runId)).send({
            ...leaseBody,
            requestId: controlRequestId,
            status: 'succeeded',
            resultMessage: `${action} delivered by instance A`,
          })
        ).status,
      ).toBe(200);

      const statusResponse = await rootAgentB
        .get(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, runId))
        .query({ requestId: controlRequestId });
      expect(statusResponse.status).toBe(200);
      expect(getData(statusResponse)).toMatchObject({
        runId,
        controlRequestId,
        controlRequestStatus: 'succeeded',
      });
    }
  });

  it('atomically consumes one browser ticket when two instances subscribe concurrently', async () => {
    const transport = new ControllableSharedTerminalTransport();
    const runner = await createRunner(instanceA, { nodeKey: `terminal-ticket-cluster-${randomUUID()}` });
    const runId = await createQueuedRun(instanceA, runner, `terminal-ticket-cluster-run-${randomUUID()}`);
    const claim = await claimRun(instanceA, runner, runId);
    const serverA = await createTerminalStreamServer(instanceA, transport);
    const serverB = await createTerminalStreamServer(instanceB, transport);
    const daemon = createWebSocket(serverA.wsUrl, { nodeToken: runner.nodeToken });
    const ticket = await createBrowserStreamTicket(instanceA, { userId: rootUserId, runId });
    const browserA = createWebSocket(serverA.wsUrl, { streamTicket: ticket });
    const browserB = createWebSocket(serverB.wsUrl, { streamTicket: ticket });

    try {
      await Promise.all([waitForOpen(daemon), waitForOpen(browserA), waitForOpen(browserB)]);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'ticket-cluster-register',
        nodeId: runner.nodeId,
        capabilities: { terminalStream: true },
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'ticket-cluster-register');
      sendFrame(daemon, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'ticket-cluster-bind',
        runId,
        sessionName: 'agw_terminal_ticket_cluster',
        startOffset: 0,
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
      });
      await waitForFrame(daemon, (frame) => frame.type === 'ack' && frame.requestId === 'ticket-cluster-bind');

      const resultA = waitForFrame(
        browserA,
        (frame) => frame.requestId === 'ticket-cluster-subscribe-a' && (frame.type === 'ack' || frame.type === 'error'),
      );
      const resultB = waitForFrame(
        browserB,
        (frame) => frame.requestId === 'ticket-cluster-subscribe-b' && (frame.type === 'ack' || frame.type === 'error'),
      );
      sendBrowserSubscribe(browserA, { runId, requestId: 'ticket-cluster-subscribe-a' });
      sendBrowserSubscribe(browserB, { runId, requestId: 'ticket-cluster-subscribe-b' });
      const results = await Promise.all([resultA, resultB]);
      expect(results.filter((frame) => frame.type === 'ack')).toHaveLength(1);
      expect(results.filter((frame) => frame.type === 'error')).toHaveLength(1);
      expect(results.find((frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_STREAM_TICKET_SCOPE_MISMATCH',
      });
    } finally {
      daemon.close();
      browserA.close();
      browserB.close();
      await serverA.close();
      await serverB.close();
    }
  });

  it('reports a shared transport gap, swaps daemon/browser instances, restores a snapshot, and deduplicates replay', async () => {
    const transport = new ControllableSharedTerminalTransport();
    const runner = await createRunner(instanceA, { nodeKey: `terminal-swap-cluster-${randomUUID()}` });
    const runId = await createQueuedRun(instanceA, runner, `terminal-swap-cluster-run-${randomUUID()}`);
    const claim = await claimRun(instanceA, runner, runId);
    const serverA = await createTerminalStreamServer(instanceA, transport);
    const serverB = await createTerminalStreamServer(instanceB, transport);
    const daemonA = createWebSocket(serverA.wsUrl, { nodeToken: runner.nodeToken });
    const ticketB = await createBrowserStreamTicket(instanceB, { userId: rootUserId, runId });
    const browserB = createWebSocket(serverB.wsUrl, { streamTicket: ticketB });
    let daemonB: WebSocket | undefined;
    let browserA: WebSocket | undefined;

    try {
      await Promise.all([waitForOpen(daemonA), waitForOpen(browserB)]);
      sendFrame(daemonA, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'swap-register-a',
        nodeId: runner.nodeId,
        capabilities: { terminalStream: true },
      });
      await waitForFrame(daemonA, (frame) => frame.type === 'ack' && frame.requestId === 'swap-register-a');
      sendFrame(daemonA, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'swap-bind-a',
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        startOffset: 0,
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
      });
      await waitForFrame(daemonA, (frame) => frame.type === 'ack' && frame.requestId === 'swap-bind-a');

      const initialSnapshotRequest = waitForFrame(
        daemonA,
        (frame) => frame.type === 'daemon.snapshotRequest' && frame.runId === runId,
      );
      sendBrowserSubscribe(browserB, { runId, requestId: 'swap-subscribe-b', lastOffset: 0 });
      await waitForFrame(browserB, (frame) => frame.type === 'ack' && frame.requestId === 'swap-subscribe-b');
      const initialSnapshot = await initialSnapshotRequest;
      sendFrame(daemonA, {
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        requestId: initialSnapshot.type === 'daemon.snapshotRequest' ? initialSnapshot.requestId : '',
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        offsetStart: 0,
        offsetEnd: 0,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: '',
      });
      await waitForFrame(browserB, (frame) => frame.type === 'terminal.snapshot');

      const firstText = 'cluster-before-outage\n';
      const secondText = 'cluster-dropped-during-outage\n';
      const thirdText = 'cluster-gap-marker\n';
      const firstEnd = Buffer.byteLength(firstText);
      const secondEnd = firstEnd + Buffer.byteLength(secondText);
      const thirdEnd = secondEnd + Buffer.byteLength(thirdText);
      sendFrame(daemonA, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        offsetStart: 0,
        offsetEnd: firstEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(firstText),
      });
      expect(
        decodeTerminalPayload((await waitForFrame(browserB, (frame) => frame.type === 'terminal.data')).payload),
      ).toBe(firstText);

      transport.connected = false;
      sendFrame(daemonA, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        offsetStart: firstEnd,
        offsetEnd: secondEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(secondText),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      transport.connected = true;
      sendFrame(daemonA, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        offsetStart: secondEnd,
        offsetEnd: thirdEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(thirdText),
      });
      expect(await waitForFrame(browserB, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_OFFSET_GAP',
        details: { reconnectRequired: true },
      });
      expect(await waitForNoFrame(browserB, (frame) => frame.type === 'terminal.data', 100)).toBe(false);

      browserB.close();
      daemonA.close();
      daemonB = createWebSocket(serverB.wsUrl, { nodeToken: runner.nodeToken });
      await waitForOpen(daemonB);
      sendFrame(daemonB, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'swap-register-b',
        nodeId: runner.nodeId,
        capabilities: { terminalStream: true },
      });
      await waitForFrame(daemonB, (frame) => frame.type === 'ack' && frame.requestId === 'swap-register-b');
      sendFrame(daemonB, {
        type: 'daemon.bindRun',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'swap-bind-b',
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        startOffset: thirdEnd,
        claimToken: claim.claimToken,
        claimAttempt: claim.claimAttempt,
        leaseVersion: claim.leaseVersion,
      });
      await waitForFrame(daemonB, (frame) => frame.type === 'ack' && frame.requestId === 'swap-bind-b');

      const ticketA = await createBrowserStreamTicket(instanceA, { userId: rootUserId, runId });
      browserA = createWebSocket(serverA.wsUrl, { streamTicket: ticketA });
      await waitForOpen(browserA);
      const recoveredSnapshotRequest = waitForFrame(
        daemonB,
        (frame) => frame.type === 'daemon.snapshotRequest' && frame.runId === runId,
      );
      sendBrowserSubscribe(browserA, { runId, requestId: 'swap-subscribe-a', lastOffset: firstEnd });
      await waitForFrame(browserA, (frame) => frame.type === 'ack' && frame.requestId === 'swap-subscribe-a');
      const snapshotRequest = await recoveredSnapshotRequest;
      sendFrame(daemonB, {
        type: 'terminal.snapshot',
        protocol: TERMINAL_PROTOCOL,
        requestId: snapshotRequest.type === 'daemon.snapshotRequest' ? snapshotRequest.requestId : '',
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        offsetStart: firstEnd,
        offsetEnd: thirdEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(`${secondText}${thirdText}`),
      });
      const recoveredSnapshot = await waitForFrame(browserA, (frame) => frame.type === 'terminal.snapshot');
      expect(
        decodeTerminalPayload(recoveredSnapshot.type === 'terminal.snapshot' ? recoveredSnapshot.payload : ''),
      ).toBe(`${secondText}${thirdText}`);

      const fourthText = 'cluster-after-swap\n';
      const fourthEnd = thirdEnd + Buffer.byteLength(fourthText);
      transport.duplicateNextDaemonFrame = true;
      sendFrame(daemonB, {
        type: 'terminal.data',
        protocol: TERMINAL_PROTOCOL,
        runId,
        sessionName: 'agw_terminal_swap_cluster',
        offsetStart: thirdEnd,
        offsetEnd: fourthEnd,
        payloadEncoding: TERMINAL_PAYLOAD_ENCODING,
        payload: encodeTerminalPayload(fourthText),
      });
      const fourthFrame = await waitForFrame(browserA, (frame) => frame.type === 'terminal.data');
      expect(decodeTerminalPayload(fourthFrame.type === 'terminal.data' ? fourthFrame.payload : '')).toBe(fourthText);
      expect(await waitForNoFrame(browserA, (frame) => frame.type === 'terminal.data', 100)).toBe(false);
    } finally {
      daemonA.close();
      daemonB?.close();
      browserA?.close();
      browserB.close();
      await serverA.close();
      await serverB.close();
    }
  });
});
