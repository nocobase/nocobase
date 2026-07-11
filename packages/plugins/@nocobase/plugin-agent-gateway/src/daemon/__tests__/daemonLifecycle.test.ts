/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

import { readDaemonConfig } from '../config';
import { AgentGatewayDaemonNodeClient } from '../gateway';
import { heartbeatDaemonNode, registerDaemonNode } from '../registration';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../types';

const execFileAsync = promisify(execFile);

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

function getExpectedDefaultNodeKey(installationId: string) {
  const normalizedHostname = os
    .hostname()
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '-')
    .replace(/-+/g, '-');
  return `${normalizedHostname || 'local'}-agent-gateway-${installationId.slice(0, 8)}`;
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
    expect(registerResult.installationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(registerResult)).not.toContain('NODE_TOKEN_SECRET');

    const config = await readDaemonConfig(configPath);
    expect(config.nodeToken).toBe('ag_node_NODE_TOKEN_SECRET');
    expect(config.installationId).toBe(registerResult.installationId);
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
    expect((requester.calls[0].body as JsonRecord).installationId).toBe(config.installationId);
    expect(requester.calls[1]).toMatchObject({
      method: 'POST',
      path: '/api/agent-gateway/nodes/node-1/heartbeat',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
    });
    expect((requester.calls[1].body as JsonRecord).installationId).toBe(config.installationId);
    expect(JSON.stringify(requester.calls[1].body)).toContain('opencode');
  });

  it('uses an installation-scoped node key when registering without an explicit key', async () => {
    const requester = new FakeRequester();
    const configPath = path.join(tempDir, 'config.json');
    await registerDaemonNode({
      requester,
      serverUrl: 'https://nocobase.example.test',
      inviteToken: 'ag_inv_INVITE_TOKEN_SECRET',
      configPath,
    });

    const installationId = String((requester.calls[0].body as JsonRecord).installationId);
    expect((requester.calls[0].body as JsonRecord).nodeKey).toBe(getExpectedDefaultNodeKey(installationId));
  });

  it('preserves a supplied installation id when registering again', async () => {
    const requester = new FakeRequester();
    const configPath = path.join(tempDir, 'config.json');
    const installationId = '11111111-2222-4333-8444-555555555555';

    const result = await registerDaemonNode({
      requester,
      serverUrl: 'https://nocobase.example.test',
      inviteToken: 'ag_inv_INVITE_TOKEN_SECRET',
      configPath,
      installationId,
    });

    expect(result.installationId).toBe(installationId);
    expect((requester.calls[0].body as JsonRecord).installationId).toBe(installationId);
    expect((await readDaemonConfig(configPath)).installationId).toBe(installationId);
  });

  it('includes the installation id in daemon node client heartbeats', async () => {
    const requester = new FakeRequester();
    const gateway = new AgentGatewayDaemonNodeClient(requester, {
      serverUrl: 'https://nocobase.example.test',
      nodeId: 'node-1',
      nodeKey: 'node-key-1',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      installationId: '11111111-2222-4333-8444-555555555555',
      savedAt: '2026-07-01T00:00:00.000Z',
    });

    await gateway.heartbeatNode({ profiles: [] });

    expect((requester.calls[0].body as JsonRecord).installationId).toBe('11111111-2222-4333-8444-555555555555');
  });

  it('backfills a legacy config with one persistent installation id', async () => {
    const configPath = path.join(tempDir, 'legacy-config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify({
        serverUrl: 'https://nocobase.example.test',
        nodeId: 'node-1',
        nodeKey: 'node-key-1',
        nodeToken: 'ag_node_NODE_TOKEN_SECRET',
        savedAt: '2026-07-01T00:00:00.000Z',
      }),
    );

    const first = await readDaemonConfig(configPath);
    const storedAfterBackfill = await fs.readFile(configPath, 'utf8');
    const second = await readDaemonConfig(configPath);

    expect(first.installationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(second.installationId).toBe(first.installationId);
    expect(await fs.readFile(configPath, 'utf8')).toBe(storedAfterBackfill);
  });

  it('keeps install script token input separate from script download and URL arguments', async () => {
    const scriptPath = path.resolve(__dirname, '../../../scripts/install-agent-gateway-daemon.sh');
    const script = await fs.readFile(scriptPath, 'utf8');

    await expect(execFileAsync('bash', ['-n', scriptPath])).resolves.toBeTruthy();
    expect(script).toContain('--invite-token-stdin');
    expect(script).toContain('AGENT_GATEWAY_NODE_KEY');
    expect(script).toContain('AGENT_GATEWAY_DAEMON_PACKAGE_URL');
    expect(script).toContain('AGENT_GATEWAY_SERVICE_SCOPE');
    expect(script).toContain('AGENT_GATEWAY_HEALTH_CHECK');
    expect(script).toContain('AGENT_GATEWAY_AGENT_PATH');
    expect(script).toContain('/api/agent-gateway/daemon-package.tgz');
    expect(script).toContain('download_file "$DAEMON_PACKAGE_URL"');
    expect(script).toContain('tar -xzf "$package_archive"');
    expect(script).toContain('DAEMON_CMD=(node "$package_dir/package/daemon.js")');
    expect(script).toContain('Existing Agent Gateway daemon registration is still valid');
    expect(script).toContain('Migrated existing Agent Gateway daemon config');
    expect(script).toContain('--node-key "$NODE_KEY"');
    expect(script).toContain('can_install_system_service');
    expect(script).toContain('/etc/systemd/system/$SERVICE_NAME.service');
    expect(script).toContain('systemctl enable --now "$SERVICE_NAME.service"');
    expect(script).toContain('systemctl --user enable --now');
    expect(script).toContain('EnvironmentFile=$ENV_FILE');
    expect(script).toContain('write_env_assignment PATH "$EFFECTIVE_PATH"');
    expect(script).toContain('append_path_dir "$HOME/.fnm/current/bin"');
    expect(script).toContain('for node_bin_dir in "$HOME"/.nvm/versions/node/*/bin');
    expect(script).toContain('"$HOME"/.local/share/fnm/node-versions/*/installation/bin');
    expect(script).toContain('Restart=always');
    expect(script).toContain('ExecStart=$RUN_SCRIPT');
    expect(script).toContain('exec $DAEMON_COMMAND run');
    expect(script).toContain('while true; do');
    expect(script).toContain('Agent Gateway daemon exited with status');
    expect(script).toContain('tmux new-session');
    expect(script).toContain('systemctl is-active --quiet');
    expect(script).toContain('Agent Gateway daemon heartbeat verified');
    expect(script).toContain('AGENT_GATEWAY_INVITE_TOKEN');
    expect(script).not.toMatch(/\?[^ \n]*invite/i);
    expect(script).not.toMatch(/\?[^ \n]*token/i);
    expect(script).not.toContain('--invite-token "$AGENT_GATEWAY_INVITE_TOKEN"');
  });
});
