import { AIManager, MemoryRepositoryFactory } from '@nocobase/ai-employee';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MCPCandidateInput } from '../server/route/schemas.js';
import { AIMCPServerService } from '../server/service/ai-mcp-server-service.js';

afterEach(() => {
  vi.restoreAllMocks();
});

async function createService() {
  const ai = new AIManager({ repositories: new MemoryRepositoryFactory() });
  vi.spyOn(ai.mcpServerManager, 'rebuildClient').mockResolvedValue(
    undefined as never,
  );
  // The probe itself is not under test, and a real stdio probe would spawn.
  const probe = vi
    .spyOn(ai.mcpServerManager, 'testConnection')
    .mockResolvedValue({ success: true, toolsCount: 0 });
  const service = new AIMCPServerService({ ai });
  await service.syncConfiguredMCPServers({
    local: { transport: 'stdio', command: 'configured-command', args: ['-v'] },
  });
  return { service, probe };
}

describe('AIMCPServerService connection tests', () => {
  it('accepts no inline stdio server, so nothing is spawned from a request body', () => {
    expect(
      MCPCandidateInput.safeParse({
        transport: 'stdio',
        command: 'touch',
        args: ['/tmp/pwned'],
      }).success,
    ).toBe(false);
    expect(
      MCPCandidateInput.safeParse({
        transport: 'http',
        url: 'https://example.test/mcp',
        command: 'touch',
      }).success,
    ).toBe(false);
  });

  it('tests a configured stdio server by name, using only its saved configuration', async () => {
    const { service, probe } = await createService();

    await service.testConnection({ name: 'local' });
    expect(probe).toHaveBeenCalledOnce();
    expect(probe.mock.calls[0][0]).toMatchObject({
      transport: 'stdio',
      command: 'configured-command',
      args: ['-v'],
    });
  });

  it('answers an unknown server name with 404 and tests nothing', async () => {
    const { service, probe } = await createService();

    await expect(
      service.testConnection({ name: 'missing' }),
    ).rejects.toMatchObject({ status: 404, reason: 'MCP_SERVER_NOT_FOUND' });
    expect(probe).not.toHaveBeenCalled();
  });

  it('tests an unsaved remote server from its values', async () => {
    const { service, probe } = await createService();

    await service.testCandidate({
      values: { transport: 'http', url: 'https://example.test/mcp' },
    });
    expect(probe.mock.calls[0][0]).toMatchObject({
      transport: 'http',
      url: 'https://example.test/mcp',
    });
  });

  it('refuses to synchronize a configured server named like a fixed route segment', async () => {
    const { service } = await createService();

    await expect(
      service.syncConfiguredMCPServers({
        tools: { transport: 'http', url: 'https://example.test/mcp' },
      }),
    ).rejects.toThrow(/MCP server "tools" uses a reserved name/);
  });
});
