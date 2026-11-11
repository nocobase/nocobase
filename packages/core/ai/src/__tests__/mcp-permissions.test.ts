/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { Transaction } from '@nocobase/database';
import { createMockServer, type MockServer } from '@nocobase/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DefaultMCPManager } from '../mcp-manager';
import { DefaultToolsManager } from '../tools-manager';
import type { Permission } from '../tools-manager/types';

const mocks = vi.hoisted(() => ({ failInitialize: false, invoke: vi.fn(async () => 'done') }));
vi.mock('@langchain/mcp-adapters', () => ({
  MultiServerMCPClient: class {
    constructor(private connections: Record<string, unknown>) {}
    async initializeConnections() {
      if (mocks.failInitialize) throw new Error('initialize failed');
      return Object.fromEntries(
        Object.keys(this.connections).map((name) => [
          name,
          ['get-data', 'write-data'].map((toolName) => ({
            name: toolName,
            description: toolName,
            schema: {},
            invoke: mocks.invoke,
          })),
        ]),
      );
    }
    async close() {}
  },
}));

describe('global MCP tool permissions', () => {
  let app: MockServer;
  let storage: string;
  let manager: DefaultMCPManager;
  const clients = () => app.db.getRepository('aiMcpClients');
  const permissions = () => app.db.getRepository('aiMcpToolPermissions');
  const permissionModel = () => app.db.getModel('aiMcpToolPermissions');
  const ctx = (id: number) => ({ state: { currentUser: { id } }, t: (key: string) => key }) as unknown as Context;
  const toolsManager = (mcp = manager) => {
    const tools = new DefaultToolsManager();
    tools.registerDynamicTools(mcp.getMCPToolsProvider());
    return tools;
  };

  beforeAll(async () => {
    storage = await mkdtemp(join(tmpdir(), 'mcp-permissions-'));
    vi.stubEnv('STORAGE_PATH', storage);
    app = await createMockServer({
      plugins: ['nocobase'],
      acl: true,
      database: { dialect: 'sqlite', storage: join(storage, 'test.sqlite') },
    });
    await app.pm.enable('ai');
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    mocks.invoke.mockClear();
    mocks.failInitialize = false;
    await clients().destroy({ filter: { name: { $ne: null } } });
    await clients().create({
      values: { name: 'test-server', transport: 'http', url: 'http://localhost/mcp' },
    });
    manager = new DefaultMCPManager(app);
    await manager.init();
    app.aiManager.mcpManager = manager;
  });

  afterEach(async () => {
    await manager?.getClient()?.close();
    await manager?.clearUserContextCache();
  });

  afterAll(async () => {
    await app?.destroy();
    vi.unstubAllEnvs();
    await rm(storage, { recursive: true, force: true });
  });

  it('does not persist defaults during discovery, listing, registration or rebuilding', async () => {
    expect((await manager.listMCPTools())['test-server'].map((tool) => tool.permission)).toEqual(['ALLOW', 'ASK']);
    expect((await toolsManager().listTools()).map((tool) => tool.defaultPermission)).toEqual(['ALLOW', 'ASK']);
    await manager.rebuildClient();
    expect(await permissions().count()).toBe(0);
  });

  it('creates the permission collection on upgrade without changing existing MCP configuration', async () => {
    await permissionModel().drop();
    await app.upgrade();
    expect(await permissions().count()).toBe(0);
    expect(await app.aiManager.mcpManager.getMCP('test-server')).toMatchObject({
      enabled: true,
      transport: 'http',
      url: 'http://localhost/mcp',
    });
    const upgraded = app.aiManager.mcpManager;
    await upgraded.rebuildClient();
    await upgraded.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    expect(await permissions().count()).toBe(1);
  });

  it('restores both reversed defaults on a new manager and preserves explicit values equal to defaults', async () => {
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    await manager.updateMCPToolPermission('mcp-test-server-write-data', 'ALLOW');
    const restarted = new DefaultMCPManager(app);
    await restarted.init();
    expect((await restarted.listMCPTools())['test-server'].map((tool) => tool.permission)).toEqual(['ASK', 'ALLOW']);
    expect((await toolsManager(restarted).listTools()).map((tool) => tool.defaultPermission)).toEqual(['ASK', 'ALLOW']);
    await restarted.updateMCPToolPermission('mcp-test-server-get-data', 'ALLOW');
    await restarted.updateMCPToolPermission('mcp-test-server-write-data', 'ASK');
    expect(await permissions().count()).toBe(2);
    expect((await manager.listMCPTools())['test-server'].map((tool) => tool.permission)).toEqual(['ALLOW', 'ASK']);
    await restarted.getClient()?.close();
  });

  it('refreshes permissions across managers on every subsequent tool resolution', async () => {
    const other = new DefaultMCPManager(app);
    await other.init();
    const tools = toolsManager(other);
    expect((await tools.getTools('mcp-test-server-get-data')).defaultPermission).toBe('ALLOW');
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    expect((await tools.getTools('mcp-test-server-get-data')).defaultPermission).toBe('ASK');
    expect((await other.listMCPTools())['test-server'][0].permission).toBe('ASK');
    await other.getClient()?.close();
  });

  it('preserves permissions on disable and prevents stale tools from being listed or invoked', async () => {
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    const tools = toolsManager();
    const oldTool = await tools.getTools('mcp-test-server-get-data');
    await clients().update({ filterByTk: 'test-server', values: { enabled: false } });
    expect(await manager.listMCPTools()).toEqual({});
    expect(await tools.listTools()).toEqual([]);
    await expect(oldTool.invoke(ctx(1), {}, { toolCallId: 'test', writer: vi.fn() })).rejects.toThrow(
      'MCP server is disabled or deleted',
    );
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(await permissions().count()).toBe(1);
    await clients().update({ filterByTk: 'test-server', values: { enabled: true } });
    await manager.rebuildClient();
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ASK');
  });

  it('deletes permissions atomically and does not inherit them on same-name recreation', async () => {
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    const transaction = await app.db.sequelize.transaction();
    await clients().destroy({ filterByTk: 'test-server', transaction });
    expect(await permissions().count({ transaction })).toBe(0);
    await transaction.rollback();
    expect(await clients().count()).toBe(1);
    expect(await permissions().count()).toBe(1);
    await clients().destroy({ filterByTk: 'test-server' });
    expect(await permissions().count()).toBe(0);
    expect(await manager.listMCPTools()).toEqual({});
    await clients().create({ values: { name: 'test-server', transport: 'http' } });
    await manager.rebuildClient();
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ALLOW');
  });

  it('enforces cascading deletion even for a bulk model delete without individual hooks', async () => {
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    await app.db.getModel('aiMcpClients').destroy({ where: { name: 'test-server' }, hooks: false });
    expect(await permissions().count()).toBe(0);
  });

  it('keeps the unique constraint for repeated and concurrent saves without overwriting other tools', async () => {
    await Promise.all([
      manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK'),
      manager.updateMCPToolPermission('mcp-test-server-write-data', 'ALLOW'),
    ]);
    await Promise.all([
      manager.updateMCPToolPermission('mcp-test-server-get-data', 'ALLOW'),
      manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK'),
    ]);
    expect(await permissions().count()).toBe(2);
    const stored = await permissions().findOne({ filter: { serverName: 'test-server', toolName: 'write-data' } });
    expect(stored.get('permission')).toBe('ALLOW');
  });

  it('fails closed on database reads and never changes effective permission after a failed save', async () => {
    const save = vi.spyOn(permissionModel(), 'upsert').mockRejectedValue(new Error('write failed'));
    await expect(manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK')).rejects.toThrow('write failed');
    expect(await permissions().count()).toBe(0);
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ALLOW');
    save.mockRestore();
    vi.spyOn(permissionModel(), 'findAll').mockRejectedValue(new Error('read failed'));
    await expect(manager.listMCPTools()).rejects.toThrow('read failed');
    await expect(toolsManager().listTools()).rejects.toThrow('read failed');
  });

  it('rejects invalid values, unknown tools and ambiguous public names without splitting hyphens', async () => {
    for (const permission of ['DENY', '', null, {}, ['ASK']]) {
      await expect(
        manager.updateMCPToolPermission('mcp-test-server-get-data', permission as Permission),
      ).rejects.toThrow('Invalid MCP tool permission');
    }
    await expect(manager.updateMCPToolPermission('mcp-unknown-get-data', 'ASK')).rejects.toThrow(
      'MCP tool not found or ambiguous',
    );
    await clients().create({ values: { name: 'test', transport: 'http' } });
    Reflect.set(manager, 'toolsMap', {
      'test-server': [{ name: 'get-data' }],
      test: [{ name: 'server-get-data' }],
    });
    await expect(manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK')).rejects.toThrow(
      'MCP tool not found or ambiguous',
    );
    expect(await permissions().count()).toBe(0);
  });

  it('shares global permissions between users and restores user-context tools after manager recreation', async () => {
    await clients().update({ filterByTk: 'test-server', values: { useUserContext: true } });
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK', ctx(1));
    expect((await manager.listMCPTools(ctx(2)))['test-server'][0].permission).toBe('ASK');
    const restarted = new DefaultMCPManager(app);
    await restarted.init();
    expect((await toolsManager(restarted).listTools({ ctx: ctx(2) }))[0].defaultPermission).toBe('ASK');
    await restarted.updateMCPToolPermission('mcp-test-server-write-data', 'ALLOW', ctx(2));
    expect((await manager.listMCPTools(ctx(1)))['test-server'][1].permission).toBe('ALLOW');
    await clients().update({ filterByTk: 'test-server', values: { enabled: false } });
    expect(await manager.listMCPTools(ctx(1))).toEqual({});
    await restarted.clearUserContextCache();
  });

  it('does not overwrite explicit permissions during file configuration sync or tool disappearance', async () => {
    await manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK');
    await manager.registerMCP({
      'test-server': { transport: 'http', url: 'http://localhost/mcp', fromFile: true },
    });
    await manager.registerMCP({
      'test-server': { transport: 'http', url: 'http://localhost/mcp', fromFile: true },
    });
    await manager.rebuildClient();
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ASK');
    Reflect.set(manager, 'toolsMap', { 'test-server': [] });
    await manager.listMCPTools();
    expect(await permissions().count()).toBe(1);
  });

  it('batches permission reads rather than issuing one query per tool', async () => {
    const read = vi.spyOn(permissionModel(), 'findAll');
    await manager.listMCPTools();
    expect(read).toHaveBeenCalledTimes(1);
    read.mockClear();
    await toolsManager().listTools();
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('does not save a permission when user-context tool discovery fails', async () => {
    await clients().update({ filterByTk: 'test-server', values: { useUserContext: true } });
    mocks.failInitialize = true;
    await expect(manager.updateMCPToolPermission('mcp-test-server-get-data', 'ASK', ctx(1))).rejects.toThrow(
      'MCP tool not found or ambiguous',
    );
    expect(await permissions().count()).toBe(0);
  });

  it('allows permissions for deployment-managed stdio tools without changing their connection', async () => {
    await clients().update({
      filterByTk: 'test-server',
      values: { transport: 'stdio', command: 'trusted', fromFile: true },
    });
    const agent = await app.agent().login(1);
    const response = await agent.resource('aiMcpClients').updateToolPermission({
      values: { toolName: 'mcp-test-server-get-data', permission: 'ASK', command: 'untrusted' },
    });
    expect(response.status).toBe(200);
    expect((await manager.getMCP('test-server')).command).toBe('trusted');
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ASK');
  });

  it('persists administrator API changes, protects ACL and does not change file-managed connection fields', async () => {
    await clients().update({ filterByTk: 'test-server', values: { fromFile: true } });
    const admin = await app.agent().login(1);
    const resource = admin.resource('aiMcpClients');
    const response = await resource.updateToolPermission({
      values: {
        toolName: 'mcp-test-server-get-data',
        permission: 'ASK',
        command: 'untrusted',
        url: 'http://attacker.invalid',
        fromFile: false,
      },
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ success: true });
    const list = await resource.listTools();
    expect(list.body.data['test-server'][0].permission).toBe('ASK');
    expect(await clients().count()).toBe(1);
    const server = await clients().findOne({ filterByTk: 'test-server' });
    expect(server.get('fromFile')).toBe(true);
    expect(server.get('url')).toBe('http://localhost/mcp');
    expect(server.get('command')).toBeFalsy();

    const user = await app.db.getRepository('users').create({ values: { username: 'mcp-permission-member' } });
    const member = await app.agent().login(user.id);
    const denied = await member.resource('aiMcpClients').updateToolPermission({
      values: { toolName: 'mcp-test-server-get-data', permission: 'ALLOW' },
    });
    expect(denied.status).toBe(403);
    const guest = await app
      .agent()
      .resource('aiMcpClients')
      .updateToolPermission({
        values: { toolName: 'mcp-test-server-get-data', permission: 'ALLOW' },
      });
    expect([401, 403]).toContain(guest.status);
    const generic = await member.resource('aiMcpToolPermissions').create({
      values: { serverName: 'test-server', toolName: 'write-data', permission: 'ALLOW' },
    });
    expect(generic.status).toBe(403);
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ASK');
    expect(await permissions().count()).toBe(1);
  });

  it('rejects malformed API input and localizes errors without writing records', async () => {
    const agent = await app.agent().login(1);
    for (const values of [
      {},
      { toolName: '', permission: 'ALLOW' },
      { toolName: '  ', permission: 'ALLOW' },
      { toolName: {}, permission: 'ALLOW' },
      { toolName: 'mcp-test-server-get-data', permission: 'DENY' },
      { toolName: 'mcp-test-server-get-data', permission: ['ASK'] },
    ]) {
      expect((await agent.resource('aiMcpClients').updateToolPermission({ values })).status).toBe(400);
    }
    expect(
      (
        await agent.resource('aiMcpClients').updateToolPermission({
          values: { toolName: 'mcp-unknown-get-data', permission: 'ALLOW' },
        })
      ).status,
    ).toBe(400);
    const prefix = (app.resourcer.options.prefix || '').replace(/\/$/, '');
    const response = await agent.post(`${prefix}/aiMcpClients:updateToolPermission`).set('X-Locale', 'zh-CN').send({});
    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toBe('MCP 工具权限配置无效');
    expect(await permissions().count()).toBe(0);
  });

  it('returns an API failure after a database write or commit failure instead of reporting success', async () => {
    const agent = await app.agent().login(1);
    const save = vi.spyOn(permissionModel(), 'upsert').mockRejectedValue(new Error('write failed'));
    const response = await agent.resource('aiMcpClients').updateToolPermission({
      values: { toolName: 'mcp-test-server-get-data', permission: 'ASK' },
    });
    expect(response.status).toBe(500);
    save.mockRestore();
    vi.spyOn(Transaction.prototype, 'commit').mockImplementationOnce(async function (this: Transaction) {
      await this.rollback();
      throw new Error('commit failed');
    });
    const commitFailure = await agent.resource('aiMcpClients').updateToolPermission({
      values: { toolName: 'mcp-test-server-get-data', permission: 'ASK' },
    });
    expect(commitFailure.status).toBe(500);
    expect(await permissions().count()).toBe(0);
    expect((await manager.listMCPTools())['test-server'][0].permission).toBe('ALLOW');
  });
});
