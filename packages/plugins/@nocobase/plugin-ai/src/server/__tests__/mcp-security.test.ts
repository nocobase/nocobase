/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer, type ExtendedAgent } from '@nocobase/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('MCP security through authenticated resource requests', () => {
  let app: MockServer;
  let agent: ExtendedAgent;
  let storage: string;

  beforeAll(async () => {
    storage = await mkdtemp(join(tmpdir(), 'mcp-api-'));
    vi.stubEnv('STORAGE_PATH', storage);
    app = await createMockServer({ plugins: ['nocobase'], acl: true });
    await app.pm.enable('ai');
    agent = await app.agent().login(1);
  });

  afterAll(async () => {
    await app?.destroy();
    vi.unstubAllEnvs();
    await rm(storage, { recursive: true, force: true });
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await app.db.getRepository('aiMcpClients').destroy({ filter: { name: { $ne: null } } });
    await app.db.getRepository('aiMcpClients').create({
      values: [
        {
          name: 'legacy',
          transport: 'stdio',
          command: 'node',
          args: ['trusted.js'],
          env: { TRUSTED: 'yes' },
          restart: { enabled: false },
          enabled: false,
        },
        { name: 'managed', transport: 'http', url: 'http://127.0.0.1/managed', fromFile: true, enabled: false },
        { name: 'ordinary', transport: 'sse', url: 'http://127.0.0.1/ordinary', enabled: false },
      ],
    });
  });

  const resource = () => agent.resource('aiMcpClients');
  const get = (name: string) => app.aiManager.mcpManager.getMCP(name);

  it('keeps ACL in front of protected operations', async () => {
    const guest = await app
      .agent()
      .resource('aiMcpClients')
      .create({ values: { transport: 'stdio' } });
    expect([401, 403]).toContain(guest.status);
    const user = await app.db.getRepository('users').create({ values: { username: 'mcp-no-permissions' } });
    const unprivileged = await app.agent().login(user.id);
    const response = await unprivileged
      .resource('aiMcpClients')
      .update({ filterByTk: 'ordinary', values: { title: 'not-allowed' } });
    expect(response.status).toBe(403);
    expect((await get('ordinary')).title).not.toBe('not-allowed');
  });

  it('rejects stdio creation and remote-to-stdio conversion without writes', async () => {
    expect(
      (await resource().create({ values: { name: 'attack', transport: 'stdio', command: 'malicious' } })).status,
    ).toBe(403);
    expect(await get('attack')).toBeUndefined();
    expect(
      (await resource().update({ filterByTk: 'ordinary', values: { transport: 'stdio', command: 'malicious' } }))
        .status,
    ).toBe(403);
    expect(await get('ordinary')).toMatchObject({ transport: 'sse' });
  });

  it.each(['legacy', 'managed'])('protects %s but permits an enabled-only update', async (name) => {
    expect((await resource().update({ filterByTk: name, values: { title: 'changed' } })).status).toBe(403);
    expect(
      (await resource().update({ filterByTk: name, values: { enabled: true, description: 'changed' } })).status,
    ).toBe(403);
    expect((await resource().destroy({ filterByTk: name })).status).toBe(403);
    expect(await get(name)).toMatchObject({ enabled: false });
    expect((await resource().update({ filterByTk: name, values: { enabled: true } })).status).toBe(200);
    expect(await get(name)).toMatchObject({ enabled: true });
  });

  it('strips forged fromFile on creation and update without clearing real ownership', async () => {
    expect((await resource().create({ values: { name: 'forged', transport: 'http', fromFile: true } })).status).toBe(
      200,
    );
    expect(await get('forged')).toMatchObject({ fromFile: false });
    expect(
      (await resource().update({ filterByTk: 'ordinary', values: { title: 'editable', fromFile: true } })).status,
    ).toBe(200);
    expect(await get('ordinary')).toMatchObject({ fromFile: false, title: 'editable' });
    expect(
      (await resource().update({ filterByTk: 'managed', values: { enabled: true, fromFile: false } })).status,
    ).toBe(200);
    expect(await get('managed')).toMatchObject({ fromFile: true, enabled: true });
  });

  it('preserves ordinary HTTP/SSE CRUD', async () => {
    expect(
      (await resource().create({ values: { name: 'remote-new', transport: 'http', url: 'http://127.0.0.1/new' } }))
        .status,
    ).toBe(200);
    expect(
      (await resource().update({ filterByTk: 'remote-new', values: { title: 'New', transport: 'sse' } })).status,
    ).toBe(200);
    expect(await get('remote-new')).toMatchObject({ title: 'New', transport: 'sse', fromFile: false });
    expect((await resource().destroy({ filterByTk: 'remote-new' })).status).toBe(200);
    expect(await get('remote-new')).toBeUndefined();
  });

  it.each(['update', 'destroy'])('rejects the entire mixed filterByTk array for %s', async (action) => {
    const response = await resource()[action]({ filterByTk: ['ordinary', 'legacy'], values: { title: 'changed' } });
    expect(response.status).toBe(403);
    expect(await get('ordinary')).toMatchObject({ transport: 'sse' });
    expect((await get('ordinary')).title).not.toBe('changed');
    expect(await get('legacy')).toBeDefined();
  });

  it.each(['update', 'destroy'])('checks every filter match, ignoring client pagination for %s', async (action) => {
    const repo = app.db.getRepository('aiMcpClients');
    await repo.create({
      values: Array.from({ length: 220 }, (_, index) => ({
        name: `bulk-${String(index).padStart(3, '0')}`,
        transport: 'http',
        enabled: false,
        fromFile: index === 219,
        description: 'bulk',
      })),
    });
    const response = await resource()[action]({
      filter: { description: 'bulk' },
      pageSize: 1,
      page: 1,
      values: { title: 'changed' },
    });
    expect(response.status).toBe(403);
    expect(await repo.count({ filter: { description: 'bulk' } })).toBe(220);
    expect(await repo.count({ filter: { title: 'changed' } })).toBe(0);
  });

  it.each(['update', 'destroy'])('honors the conjunction of filter and filterByTk for %s', async (action) => {
    const response = await resource()[action]({
      filterByTk: ['ordinary', 'managed'],
      filter: { transport: 'sse' },
      values: { title: 'allowed' },
    });
    expect(response.status).toBe(200);
    expect(await get('managed')).toMatchObject({ fromFile: true });
  });

  it.each(['update', 'destroy'])('cannot bypass protection with missing selectors in %s', async (action) => {
    const response = await resource()[action]({ values: { title: 'changed' }, forceUpdate: true });
    // The framework rejects selector-less destroy before resource middleware; preserve that existing behavior.
    expect(response.status).toBe(action === 'destroy' ? 500 : 403);
    if (action === 'destroy') {
      expect(response.body.errors[0].message).toBe('to do destroy action, filter or filterByTk is required');
    }
    expect(await get('ordinary')).toBeDefined();
    expect((await get('ordinary')).title).not.toBe('changed');
  });

  it('checks every row before array create or array update writes anything', async () => {
    expect(
      (
        await resource().create({
          values: [
            { name: 'safe-batch', transport: 'http' },
            { name: 'bad-batch', transport: 'stdio', command: 'malicious' },
          ],
        })
      ).status,
    ).toBe(403);
    expect(await get('safe-batch')).toBeUndefined();
    expect(
      (
        await resource().update({
          filterByTk: 'ordinary',
          values: [
            { name: 'ordinary', title: 'changed' },
            { name: 'legacy', command: 'malicious' },
          ],
        })
      ).status,
    ).toBe(403);
    expect((await get('ordinary')).title).not.toBe('changed');
    expect(await get('legacy')).toMatchObject({ command: 'node' });
  });

  it.each(['firstOrCreate', 'updateOrCreate'])('does not expose a stdio creation bypass through %s', async (action) => {
    expect(
      (
        await resource()[action]({
          filterKeys: ['name'],
          values: { name: 'compound', transport: 'stdio', command: 'malicious' },
        })
      ).status,
    ).toBe(403);
    expect(await get('compound')).toBeUndefined();
  });

  it('guards updateOrCreate and keeps ordinary compound operations working', async () => {
    expect(
      (await resource().updateOrCreate({ filterKeys: ['name'], values: { name: 'legacy', command: 'malicious' } }))
        .status,
    ).toBe(403);
    expect(await get('legacy')).toMatchObject({ command: 'node' });
    expect(
      (
        await resource().firstOrCreate({
          filterKeys: ['name'],
          values: { name: 'compound-safe', transport: 'http', fromFile: true },
        })
      ).status,
    ).toBe(200);
    expect(await get('compound-safe')).toMatchObject({ fromFile: false });
    expect(
      (await resource().updateOrCreate({ filterKeys: ['name'], values: { name: 'compound-safe', title: 'updated' } }))
        .status,
    ).toBe(200);
  });

  it('tests saved stdio using only database configuration, ignoring all supplied connection fields', async () => {
    const test = vi.spyOn(app.aiManager.mcpManager, 'testConnection').mockResolvedValue({ success: true });
    const response = await resource().testConnection({
      filterByTk: 'legacy',
      values: {
        name: 'different',
        transport: 'http',
        command: 'malicious',
        args: ['attack.js'],
        env: { ATTACK: 'yes' },
        restart: { enabled: true },
        url: 'http://attacker.invalid',
        headers: { Authorization: 'attack' },
        useUserContext: true,
      },
    });
    expect(response.status).toBe(200);
    expect(test).toHaveBeenCalledTimes(1);
    expect(test.mock.calls[0][0]).toMatchObject({
      transport: 'stdio',
      command: 'node',
      args: ['trusted.js'],
      env: { TRUSTED: 'yes' },
      restart: { enabled: false },
    });
    expect(JSON.stringify(test.mock.calls[0][0])).not.toContain('malicious');
    expect(test.mock.calls[0][1]?.state.currentUser.id).toBe(1);
    test.mockClear();
    expect((await resource().testConnection({ filterByTk: 'legacy' })).status).toBe(200);
    expect(test).toHaveBeenCalledTimes(1);
  });

  it.each([
    { values: { transport: 'stdio', command: 'malicious' } },
    { filterByTk: 'ordinary', values: { transport: 'stdio', command: 'malicious' } },
    { filterByTk: ['legacy', 'ordinary'], values: { transport: 'stdio' } },
  ])('rejects untrusted stdio test requests before invoking the connector: %j', async (params) => {
    const test = vi.spyOn(app.aiManager.mcpManager, 'testConnection').mockResolvedValue({ success: true });
    expect((await resource().testConnection(params)).status).toBe(403);
    expect(test).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing record and does not fall back to request values', async () => {
    const test = vi.spyOn(app.aiManager.mcpManager, 'testConnection').mockResolvedValue({ success: true });
    expect(
      (
        await resource().testConnection({
          filterByTk: 'missing',
          values: { transport: 'http', url: 'http://127.0.0.1/new' },
        })
      ).status,
    ).toBe(404);
    expect(test).not.toHaveBeenCalled();
  });

  it('reports a localized missing command without invoking the connector', async () => {
    await app.db.getRepository('aiMcpClients').update({ filterByTk: 'legacy', values: { command: null } });
    const test = vi.spyOn(app.aiManager.mcpManager, 'testConnection').mockResolvedValue({ success: true });
    const response = await resource().testConnection({ filterByTk: 'legacy', values: { command: 'malicious' } });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ success: false, error: 'Command is required for stdio transport' });
    expect(test).not.toHaveBeenCalled();
  });
  it('localizes security failures and missing-command feedback in Chinese', async () => {
    const prefix = (app.resourcer.options.prefix || '').replace(/\/$/, '');
    const response = await agent
      .post(`${prefix}/aiMcpClients:update/managed`)
      .set('X-Locale', 'zh-CN')
      .send({ title: 'changed' });
    expect(response.status).toBe(403);
    expect(response.body.errors[0].message).toBe('此 MCP 服务由部署配置管理，仅可切换启用状态。');
    await app.db.getRepository('aiMcpClients').update({ filterByTk: 'legacy', values: { command: null } });
    const test = vi.spyOn(app.aiManager.mcpManager, 'testConnection').mockResolvedValue({ success: true });
    const connection = await agent
      .post(`${prefix}/aiMcpClients:testConnection/legacy`)
      .set('X-Locale', 'zh-CN')
      .send({});
    expect(connection.body.data).toMatchObject({ success: false, error: 'Stdio 传输必须配置命令' });
    expect(test).not.toHaveBeenCalled();
  });

  it.each(['ordinary', 'managed'])(
    'preserves remote form values and the current request context for %s',
    async (name) => {
      const test = vi.spyOn(app.aiManager.mcpManager, 'testConnection').mockResolvedValue({ success: true });
      const values = {
        transport: 'http',
        url: 'http://127.0.0.1/unsaved',
        useUserContext: true,
        headers: { User: '{{ctx.currentUser.id}}' },
      };
      expect((await resource().testConnection({ filterByTk: name, values })).status).toBe(200);
      expect(test.mock.calls[0][0]).toEqual(values);
      expect(test.mock.calls[0][1]?.state.currentUser.id).toBe(1);
    },
  );
});
