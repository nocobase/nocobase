import { describe, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';

const context: OnlineAgentContext = {
  user: { id: 'alice' },
  credentials: {},
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
};

describe('OnlineAgent default tools', () => {
  it('enables bash and skill for native sessions, including HTTP creation without selected skills', async () => {
    const configurator = new OnlineAgentConfigurator();
    for (const options of [{}, { agentId: 'online' }]) {
      const config = await configurator.resolve(
        context,
        options,
        undefined,
        true,
      );
      expect(config.tool).toEqual(['bash', 'skill']);
      expect(config.skill).toEqual([]);
      expect(config.toolVersions).toEqual({ bash: '1', skill: '1' });
    }
  });

  it('allows selecting skills without repeating the default tools', async () => {
    const configurator = new OnlineAgentConfigurator();
    configurator.registerOnlineAgentScope('reports', {
      skill: ['report-skill'],
    });
    const config = await configurator.resolve(context, { scope: ['reports'] });
    expect(config.tool).toEqual(['bash', 'skill']);
    expect(config.skill).toEqual(['report-skill']);
  });

  it('preserves global, named scope and explicit tool replacements, including opt-out', async () => {
    const configurator = new OnlineAgentConfigurator();
    configurator.registerOnlineAgentGlobalScope({ tool: ['bash'] });
    configurator.registerOnlineAgentScope('no-tools', { tool: [] });
    expect((await configurator.resolve(context, {})).tool).toEqual(['bash']);
    expect(
      (await configurator.resolve(context, { scope: ['no-tools'] })).tool,
    ).toEqual([]);
    expect((await configurator.resolve(context, { tool: [] })).tool).toEqual(
      [],
    );
    expect(
      (await configurator.resolve(context, { tool: ['skill'] })).tool,
    ).toEqual(['skill']);
    await expect(
      configurator.resolve(context, { tool: [], skill: ['report-skill'] }),
    ).rejects.toThrow('Selected skills require both bash and skill tools.');
  });

  it('does not inject native defaults into Runner configuration', async () => {
    const configurator = new OnlineAgentConfigurator();
    configurator.registerOnlineAgentScope('coding', {
      agentId: 'runner-agent',
    });
    expect(
      (await configurator.resolve(context, { scope: ['coding'] })).tool,
    ).toEqual([]);
    await expect(
      configurator.resolve(context, {
        agentId: 'runner-agent',
        tool: ['bash'],
      }),
    ).rejects.toThrow(
      'Sandbox tools are only supported by the native backend.',
    );
  });

  it('preserves persisted tool snapshots on later configuration changes', async () => {
    const configurator = new OnlineAgentConfigurator();
    const previous = await configurator.resolve(context, { tool: [] });
    expect((await configurator.resolve(context, {}, previous)).tool).toEqual(
      [],
    );
    const defaults = await configurator.resolve(context, {});
    expect((await configurator.resolve(context, {}, defaults)).tool).toEqual([
      'bash',
      'skill',
    ]);
  });
});
