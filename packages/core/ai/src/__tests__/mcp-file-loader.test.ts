/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MCPLoader } from '../loader/mcp';

describe('deployment MCP file validation', () => {
  let storage: string;
  let filePath: string;
  const registerMCP = vi.fn();
  const log = { error: vi.fn() };

  beforeEach(async () => {
    storage = await mkdtemp(join(tmpdir(), 'mcp-file-'));
    // Include backslashes on POSIX too, so JSON-escaped path assertions fail outside Windows CI.
    const configStorage = join(storage, 'deployment\\config');
    vi.stubEnv('STORAGE_PATH', configStorage);
    filePath = join(configStorage, 'ai', 'mcp', 'servers.json');
    await mkdir(join(configStorage, 'ai', 'mcp'), { recursive: true });
    registerMCP.mockReset();
    log.error.mockReset();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(storage, { recursive: true, force: true });
  });

  const load = () => new MCPLoader({ registerMCP }, { log }).load();

  it('uses STORAGE_PATH and treats a missing file or an empty array as a no-op', async () => {
    await load();
    await writeFile(filePath, '[]');
    await load();
    expect(registerMCP).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('registers all transports with a trusted source marker', async () => {
    await writeFile(
      filePath,
      JSON.stringify([
        { name: 'local', transport: 'stdio', command: 'node', args: [1, null, '--test'], useUserContext: true },
        { name: 'remote', transport: 'http', url: 'http://127.0.0.1/mcp', headers: { count: 2 }, useUserContext: true },
        { name: 'events', transport: 'sse', env: { count: 3 }, extraMetadata: 'kept' },
      ]),
    );
    await load();
    expect(registerMCP).toHaveBeenCalledTimes(1);
    expect(registerMCP).toHaveBeenCalledWith({
      local: expect.objectContaining({
        transport: 'stdio',
        fromFile: true,
        args: ['1', '--test'],
        useUserContext: false,
      }),
      remote: expect.objectContaining({
        transport: 'http',
        fromFile: true,
        headers: { count: '2' },
        useUserContext: true,
      }),
      events: expect.objectContaining({ transport: 'sse', fromFile: true, env: { count: '3' }, extraMetadata: 'kept' }),
    });
  });

  it.each([
    '{"secret":"do-not-log",',
    '{}',
    'null',
    '[null]',
    '[[]]',
    '[1]',
    '[{"transport":"http"}]',
    '[{"name":"  ","transport":"http"}]',
    '[{"name":1,"transport":"http"}]',
    '[{"name":"a"}]',
    '[{"name":"a","transport":"websocket"}]',
    '[{"name":"a","transport":"http","enabled":true}]',
    '[{"name":"a","transport":"http","fromFile":false}]',
    '[{"name":"a","transport":"http"},{"name":"a","transport":"sse"}]',
    '[{"name":"good","transport":"http","env":{"TOKEN":"do-not-log"}},{"name":"bad"}]',
    '[{"name":"good","transport":"http"},{"name":"bad","transport":"stdio","args":[{"toString":"do-not-log"}]}]',
    '[{"name":"good","transport":"http"},{"name":"bad","transport":"stdio","env":{"TOKEN":{"toString":"do-not-log"}}}]',
    '[{"name":"good","transport":"http"},{"name":"bad","transport":"http","headers":{"TOKEN":{"toString":"do-not-log"}}}]',
  ])('ignores the entire invalid file without exposing configuration: %s', async (contents) => {
    await writeFile(filePath, contents);
    await expect(load()).resolves.toBeUndefined();
    expect(registerMCP).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.error.mock.calls)).not.toContain('do-not-log');
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining(filePath));
  });

  it('does not log arbitrary registration errors that may contain credentials', async () => {
    await writeFile(filePath, '[{"name":"safe","transport":"http"}]');
    registerMCP.mockRejectedValueOnce(new Error('do-not-log'));
    await expect(load()).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.error.mock.calls)).not.toContain('do-not-log');
  });
});
