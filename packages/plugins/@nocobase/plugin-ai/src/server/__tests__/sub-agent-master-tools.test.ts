/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import listAIEmployeesTool from '../../ai/skills/sub-agent-master/tools/list-ai-employees';
import getAIEmployeeTool from '../../ai/skills/sub-agent-master/tools/get-ai-employee';
import dispatchSubAgentTaskTool from '../../ai/skills/sub-agent-master/tools/dispatch-sub-agent-task';

function createModel(values: Record<string, any>) {
  return {
    ...values,
    get(key: string) {
      return this[key];
    },
  };
}

describe('sub-agent-master tools', () => {
  it('should list accessible AI employees with expected fields', async () => {
    const employee = createModel({
      username: 'vera',
      nickname: 'Vera',
      position: 'Analyst',
      bio: 'Helps with analysis',
      greeting: 'Hi',
      skillSettings: { skills: ['document-search'], tools: [] },
      builtIn: false,
    });
    const plugin = {
      builtInManager: {
        setupBuiltInInfo: vi.fn(),
      },
    };
    const ctx = {
      app: {
        pm: {
          get: vi.fn().mockReturnValue(plugin),
        },
      },
      db: {
        getRepository: vi.fn((name: string) => {
          if (name === 'aiEmployees') {
            return {
              find: vi.fn().mockResolvedValue([employee]),
            };
          }
          throw new Error(`Unexpected repository: ${name}`);
        }),
      },
      state: {
        currentRoles: ['root'],
      },
    } as any;

    const result = await listAIEmployeesTool.invoke(ctx, {}, { toolCallId: 'tc-1', writer: vi.fn() });

    expect(result).toEqual([
      {
        username: 'vera',
        nickname: 'Vera',
        position: 'Analyst',
        bio: 'Helps with analysis',
        greeting: 'Hi',
        skillSettings: { skills: ['document-search'], tools: [] },
      },
    ]);
  });

  it('should fallback to defaultPrompt when about is empty', async () => {
    const employee = createModel({
      username: 'nathan',
      nickname: 'Nathan',
      position: 'Builder',
      bio: 'Builds things',
      greeting: 'Hello',
      about: '',
      defaultPrompt: 'Default prompt',
      skillSettings: { skills: ['sub-agent-master'], tools: [] },
      builtIn: false,
    });
    const plugin = {
      builtInManager: {
        setupBuiltInInfo: vi.fn(),
      },
    };
    const ctx = {
      app: {
        pm: {
          get: vi.fn().mockReturnValue(plugin),
        },
      },
      db: {
        getRepository: vi.fn((name: string) => {
          if (name === 'aiEmployees') {
            return {
              findOne: vi.fn().mockResolvedValue(employee),
            };
          }
          throw new Error(`Unexpected repository: ${name}`);
        }),
      },
      state: {
        currentRoles: ['root'],
      },
    } as any;

    const result = await getAIEmployeeTool.invoke(ctx, { username: 'nathan' }, { toolCallId: 'tc-2', writer: vi.fn() });

    expect(result).toEqual({
      username: 'nathan',
      nickname: 'Nathan',
      position: 'Builder',
      bio: 'Builds things',
      greeting: 'Hello',
      skillSettings: { skills: ['sub-agent-master'], tools: [] },
      about: 'Default prompt',
    });
  });

  it('should dispatch the task with conversation skill settings and stream writer', async () => {
    const employee = createModel({
      username: 'vera',
      modelSettings: { llmService: 'svc-1', model: 'gpt-4.1' },
      builtIn: false,
    });
    const writer = vi.fn();
    const run = vi.fn().mockImplementation(async ({ protocol, ...task }) => {
      protocol.content('partial');
      return {
        sessionId: 'sub-session-1',
        stream: Promise.resolve(`done:${task.question}`),
      };
    });
    const plugin = {
      builtInManager: {
        setupBuiltInInfo: vi.fn(),
      },
      subAgentsDispatcher: {
        run,
      },
    };
    const ctx = {
      app: {
        pm: {
          get: vi.fn().mockReturnValue(plugin),
        },
      },
      db: {
        getRepository: vi.fn((name: string) => {
          if (name === 'aiEmployees') {
            return {
              findOne: vi.fn().mockResolvedValue(employee),
            };
          }
          if (name === 'aiConversations') {
            return {
              findOne: vi.fn().mockResolvedValue({
                options: {
                  skillSettings: { skills: ['document-search'], tools: [{ name: 'searchDocs' }] },
                },
              }),
            };
          }
          throw new Error(`Unexpected repository: ${name}`);
        }),
      },
      state: {
        currentRoles: ['root'],
      },
      auth: {
        user: {
          id: 1,
        },
      },
      action: {
        params: {
          values: {
            sessionId: 'main-session-1',
            model: { llmService: 'fallback', model: 'fallback-model' },
          },
        },
      },
    } as any;

    const result = await dispatchSubAgentTaskTool.invoke(
      ctx,
      { username: 'vera', question: 'Please summarize this issue.' },
      { toolCallId: 'tc-3', writer },
    );

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx,
        employee,
        model: { llmService: 'svc-1', model: 'gpt-4.1' },
        question: 'Please summarize this issue.',
        skillSettings: { skills: ['document-search'], tools: [{ name: 'searchDocs' }] },
      }),
    );
    expect(writer).toHaveBeenCalledWith(expect.stringContaining('"type":"content"'));
    expect(result).toEqual({
      sessionId: 'sub-session-1',
      answer: 'done:Please summarize this issue.',
    });
  });
});
