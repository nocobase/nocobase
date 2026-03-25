/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SubAgentsDispatcher } from '../ai-employees/sub-agents/dispatcher';

const aiEmployeeCtor = vi.fn();
const invokeMock = vi.fn().mockResolvedValue(true);

vi.mock('../ai-employees/ai-employee', () => {
  class MockChatStreamProtocol {}

  class MockAIEmployee {
    constructor(options: any) {
      aiEmployeeCtor(options);
    }

    async invoke(...args: any[]) {
      return invokeMock(...args);
    }
  }

  return {
    AIEmployee: MockAIEmployee,
    ChatStreamProtocol: MockChatStreamProtocol,
  };
});

describe('SubAgentsDispatcher', () => {
  beforeEach(() => {
    aiEmployeeCtor.mockClear();
    invokeMock.mockClear();
  });

  it('should prefer task.model when creating sub-agent AIEmployee', async () => {
    const plugin = {
      aiConversationsManager: {
        create: vi.fn().mockResolvedValue({
          sessionId: 'sub-session-1',
        }),
      },
    } as any;
    const dispatcher = new SubAgentsDispatcher(plugin);
    const employee = {
      get: vi.fn((key: string) => {
        if (key === 'username') {
          return 'vera';
        }
        return undefined;
      }),
    } as any;
    const ctx = {
      auth: {
        user: {
          id: 1,
        },
      },
      action: {
        params: {
          values: {
            model: { llmService: 'ctx-service', model: 'ctx-model' },
          },
        },
      },
      db: {
        getRepository: vi.fn(),
      },
    } as any;

    invokeMock.mockResolvedValueOnce({
      messages: [
        { content: 'ignored' },
        {
          content: [
            { type: 'text', text: 'sub-agent ' },
            { type: 'tool_use', id: 'tool-1' },
            { type: 'text', text: 'answer' },
          ],
        },
      ],
    });

    const result = await dispatcher.run({
      ctx,
      employee,
      model: { llmService: 'task-service', model: 'task-model' },
      question: 'Handle this task',
      skillSettings: { skills: ['document-search'] },
    });

    expect(plugin.aiConversationsManager.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        aiEmployee: { username: 'vera' },
        from: 'sub-agent',
        options: {
          skillSettings: { skills: ['document-search'] },
        },
      }),
    );
    expect(aiEmployeeCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx,
        employee,
        sessionId: 'sub-session-1',
        skillSettings: { skills: ['document-search'] },
        model: { llmService: 'task-service', model: 'task-model' },
      }),
    );
    expect(await result.running).toBe('sub-agent answer');
    expect(result.sessionId).toBe('sub-session-1');
  });
});
