import { createAIManager } from '@nocobase/ai-employee';
import { describe, expect, it } from 'vitest';

import {
  AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
  AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
  AIEmployeeExampleResources,
} from '../server/index.js';

async function registerResources(): Promise<
  ReturnType<typeof createAIManager>
> {
  const ai = createAIManager();
  await new AIEmployeeExampleResources().registerAIResources(ai);
  return ai;
}

describe('AI employee example resources', () => {
  it('registers the support analyst with the ticket history tool', async () => {
    const ai = await registerResources();

    const employee = await ai.employeeManager.getEmployee(
      AI_EMPLOYEE_EXAMPLE_EMPLOYEE,
    );

    expect(employee).toMatchObject({
      username: 'iris',
      nickname: 'Iris',
      position: 'Support analyst',
    });
    expect(employee?.skillSettings.tools).toEqual([
      { name: AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL, autoCall: true },
    ]);
  });

  it('registers the ticket history tool for named employees only, without asking', async () => {
    const ai = await registerResources();

    const tool = await ai.toolsManager.getTools(
      AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
    );

    expect(tool).toMatchObject({
      scope: 'SPECIFIED',
      defaultPermission: 'ALLOW',
    });
    expect(
      await ai.toolsManager.listTools({ scope: 'GENERAL' }),
    ).not.toContainEqual(
      expect.objectContaining({
        definition: expect.objectContaining({
          name: AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
        }),
      }),
    );
  });

  it('answers a known ticket with its history and an unknown one with an error', async () => {
    const ai = await registerResources();
    const tool = await ai.toolsManager.getTools(
      AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL,
    );
    const invoke = (ticketId: string): Promise<unknown> =>
      tool!.invoke({} as never, { ticketId }, {} as never);

    const found = (await invoke('TK-1042')) as {
      status: string;
      content: string;
    };
    expect(found.status).toBe('success');
    expect(JSON.parse(found.content)).toMatchObject({
      ticketId: 'TK-1042',
      history: expect.arrayContaining([
        expect.objectContaining({ actor: 'On-call engineer' }),
      ]),
    });

    await expect(invoke('TK-0000')).resolves.toEqual({
      status: 'error',
      content: 'No support ticket with id TK-0000.',
    });
  });
});
