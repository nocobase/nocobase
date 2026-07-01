/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { readDaemonConfig } from '../config';
import { heartbeatDaemonNode, registerDaemonNode } from '../registration';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../types';

class FakeRequester implements GatewayRequester {
  calls: GatewayRequestOptions[] = [];

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    if (options.path === '/api/agent-gateway/nodes:register') {
      return {
        nodeId: 'node-1',
        nodeKey: 'node-key-1',
        nodeToken: 'ag_node_NODE_TOKEN_SECRET',
        tokenLast4: 'CRET',
        heartbeatIntervalSeconds: 30,
        claimIntervalSeconds: 10,
      } as T;
    }
    return {
      nodeId: 'node-1',
      status: 'active',
      heartbeatAt: '2026-07-01T00:00:00.000Z',
    } as T;
  }
}

describe('agent gateway daemon lifecycle client', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-daemon-lifecycle-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('registers with an invite token, persists node token locally, and heartbeats with detected profiles', async () => {
    const requester = new FakeRequester();
    const configPath = path.join(tempDir, 'config.json');
    const registerResult = await registerDaemonNode({
      requester,
      serverUrl: 'https://nocobase.example.test',
      inviteToken: 'ag_inv_INVITE_TOKEN_SECRET',
      configPath,
      nodeKey: 'node-key-1',
    });

    expect(registerResult).toMatchObject({
      nodeId: 'node-1',
      nodeKey: 'node-key-1',
      tokenLast4: 'CRET',
    });
    expect(JSON.stringify(registerResult)).not.toContain('NODE_TOKEN_SECRET');

    const config = await readDaemonConfig(configPath);
    expect(config.nodeToken).toBe('ag_node_NODE_TOKEN_SECRET');
    const storedConfig = await fs.readFile(configPath, 'utf8');
    expect(storedConfig).toContain('ag_node_NODE_TOKEN_SECRET');

    await heartbeatDaemonNode({
      requester,
      config,
      profiles: [
        {
          profileKey: 'opencode',
          displayName: 'OpenCode',
          agentType: 'code',
          driver: 'exec',
          status: 'active',
          capabilities: {
            commandKey: 'opencode',
          },
          metadata: {},
        },
      ],
    });

    expect(requester.calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/agent-gateway/nodes:register',
    });
    expect((requester.calls[0].body as JsonRecord).inviteToken).toBe('ag_inv_INVITE_TOKEN_SECRET');
    expect(requester.calls[1]).toMatchObject({
      method: 'POST',
      path: '/api/agent-gateway/nodes/node-1/heartbeat',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
    });
    expect(JSON.stringify(requester.calls[1].body)).toContain('opencode');
  });

  it('keeps install script token input separate from script download and URL arguments', async () => {
    const script = await fs.readFile(
      path.resolve(__dirname, '../../../scripts/install-agent-gateway-daemon.sh'),
      'utf8',
    );

    expect(script).toContain('--invite-token-stdin');
    expect(script).toContain('AGENT_GATEWAY_INVITE_TOKEN');
    expect(script).not.toMatch(/\?[^ \n]*invite/i);
    expect(script).not.toMatch(/\?[^ \n]*token/i);
    expect(script).not.toContain('--invite-token "$AGENT_GATEWAY_INVITE_TOKEN"');
  });
});
