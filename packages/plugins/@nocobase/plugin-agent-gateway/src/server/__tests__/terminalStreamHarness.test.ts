/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import { TERMINAL_PROTOCOL } from '../../shared/terminalStreamProtocol';
import PluginAgentGatewayServer from '../plugin';
import {
  createRunner,
  createTerminalStreamServer,
  createWebSocket,
  sendFrame,
  waitForFrame,
  waitForOpen,
} from './helpers/terminalStreamHarness';

describe('terminal stream harness', () => {
  let app: MockServer;

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
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('starts a plugin-owned websocket endpoint and authenticates daemon registration', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-harness-node' });
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: runner.nodeToken });

    try {
      await waitForOpen(daemon);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'harness-register',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });

      expect(await waitForFrame(daemon, (frame) => frame.type === 'ack')).toMatchObject({
        requestId: 'harness-register',
      });
    } finally {
      daemon.close();
      await server.close();
    }
  });

  it('returns deterministic auth failure for invalid daemon tokens', async () => {
    const runner = await createRunner(app, { nodeKey: 'terminal-stream-harness-invalid-node' });
    const server = await createTerminalStreamServer(app);
    const daemon = createWebSocket(server.wsUrl, { nodeToken: 'invalid-token' });

    try {
      await waitForOpen(daemon);
      sendFrame(daemon, {
        type: 'daemon.register',
        protocol: TERMINAL_PROTOCOL,
        requestId: 'harness-register-invalid',
        nodeId: runner.nodeId,
        capabilities: {
          terminalStream: true,
        },
      });

      expect(await waitForFrame(daemon, (frame) => frame.type === 'error')).toMatchObject({
        code: 'TERMINAL_AUTH_FAILED',
        requestId: 'harness-register-invalid',
      });
    } finally {
      daemon.close();
      await server.close();
    }
  });
});
