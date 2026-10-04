import { describe, expect, it, vi } from 'vitest';

import { AISkillService } from '../../server/service/ai-skill-service.js';
import { AIToolService } from '../../server/service/ai-tool-service.js';

function createAI() {
  return {
    skillsManager: {
      listSkills: vi.fn(async () => [
        {
          name: 'analysis',
          scope: 'GENERAL',
          description: 'Analyze records',
          content: 'private skill instructions',
        },
      ]),
      getSkills: vi.fn(async () => ({
        name: 'analysis',
        scope: 'GENERAL',
        description: 'Analyze records',
        content: 'private skill instructions',
      })),
    },
    toolsManager: {
      listTools: vi.fn(async () => [
        {
          scope: 'GENERAL',
          definition: {
            name: 'search',
            description: 'Search records',
            schema: { type: 'object' },
          },
          defaultPermission: 'ASK',
          invoke: vi.fn(),
        },
      ]),
      getTools: vi.fn(async () => ({
        scope: 'GENERAL',
        definition: { name: 'search', description: 'Search records' },
        invoke: vi.fn(),
      })),
    },
  };
}

const settingsActor = {
  id: 'admin',
  canReadAllSkills: true,
  canReadAllTools: true,
};

describe('AI employee skill and tool metadata', () => {
  it('lists summaries without skill instructions or tool code', async () => {
    const ai = createAI();
    const skills = await new AISkillService({ ai: ai as never }).list({
      actor: settingsActor,
    });
    const tools = await new AIToolService({ ai: ai as never }).list({
      actor: settingsActor,
    });

    expect(skills).toEqual([
      expect.objectContaining({ name: 'analysis', scope: 'GENERAL' }),
    ]);
    expect(skills[0]).not.toHaveProperty('content');
    expect(tools).toEqual([
      expect.objectContaining({
        name: 'search',
        scope: 'GENERAL',
        defaultPermission: 'ASK',
      }),
    ]);
    expect(tools[0]).not.toHaveProperty('invoke');
  });

  it('requires AI settings access on every read, the employee editor included', async () => {
    const ai = createAI();
    const member = { id: 'member' };
    const skills = new AISkillService({ ai: ai as never });
    const tools = new AIToolService({ ai: ai as never });

    await expect(skills.list({ actor: member })).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      skills.get({ actor: member, name: 'analysis' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(tools.list({ actor: member })).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      tools.get({ actor: member, name: 'search' }),
    ).rejects.toMatchObject({ status: 403 });
    expect(ai.skillsManager.listSkills).not.toHaveBeenCalled();
    expect(ai.toolsManager.listTools).not.toHaveBeenCalled();

    await expect(
      skills.get({ actor: settingsActor, name: 'analysis' }),
    ).resolves.toMatchObject({
      name: 'analysis',
      content: 'private skill instructions',
    });
    await expect(
      tools.get({ actor: settingsActor, name: 'search' }),
    ).resolves.toMatchObject({ name: 'search', inputSchema: null });
  });
});
