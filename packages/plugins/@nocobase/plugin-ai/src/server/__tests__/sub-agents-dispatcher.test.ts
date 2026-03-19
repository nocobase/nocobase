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
const streamMock = vi.fn().mockResolvedValue(true);

vi.mock('../ai-employees/ai-employee', () => {
  class MockChatStreamProtocol {}

  class MockAIEmployee {
    constructor(options: any) {
      aiEmployeeCtor(options);
    }

    async stream(...args: any[]) {
      return streamMock(...args);
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
    streamMock.mockClear();
  });

  it('should prefer task.model when creating sub-agent AIEmployee', async () => {
    const plugin = {
      aiConversationsManager: {
        create: vi.fn().mockResolvedValue({
          sessionId: 'sub-session-1',
        }),
      },
      db: {
        getRepository: vi.fn().mockReturnValue({
          findOne: vi.fn().mockResolvedValue({
            content: 'sub-agent answer',
          }),
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

    const result = await dispatcher.run({
      ctx,
      protocol: {} as any,
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
        protocol: {},
      }),
    );
    expect(await result.stream).toBe('sub-agent answer');
    expect(result.sessionId).toBe('sub-session-1');
  });
});
