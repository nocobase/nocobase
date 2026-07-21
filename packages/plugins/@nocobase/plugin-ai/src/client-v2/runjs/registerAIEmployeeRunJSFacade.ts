/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerRunJSContextContribution } from '@nocobase/flow-engine';
import { getFrontendToolRegistry, type FrontendToolRegistration } from '../manager/frontend-tool-registry';

type AIEmployeeRunJSFlowContext = {
  defineProperty: (name: string, descriptor: { value: unknown }) => void;
};

type AIEmployeeRunJSFacadeManager = {
  uploadFile: (...args: unknown[]) => Promise<unknown>;
  triggerTask: (...args: unknown[]) => void;
  triggerModelTask: (...args: unknown[]) => void;
};

let runJSContextContributionRegistered = false;

export const registerPluginAIRunJSContextContribution = () => {
  if (runJSContextContributionRegistered) {
    return;
  }
  runJSContextContributionRegistered = true;
  registerRunJSContextContribution(({ version, RunJSContextRegistry, FlowRunJSContext }) => {
    FlowRunJSContext.define({
      properties: {
        ai: {
          description: 'AI employee task API.',
          detail: 'AI employee facade',
          properties: {
            uploadFile: {
              type: 'function',
              description: 'Upload a file for use as an AI employee task attachment.',
              detail:
                '(file: File, options?: { onProgress?: (percent: number) => void; signal?: AbortSignal }) => Promise<Attachment>',
              completion: {
                insertText: `await ctx.ai.uploadFile(file)`,
              },
              examples: [`const attachment = await ctx.ai.uploadFile(file)`],
            },
            triggerTask: {
              type: 'function',
              description: 'Trigger an AI employee task. This is fire-and-forget and does not return a task result.',
              detail:
                '(options: { aiEmployee?: string | AIEmployee; tasks?: Task[]; chatBoxUid?: string; auto?: boolean; open?: boolean }) => void',
              completion: {
                insertText: `ctx.ai.triggerTask({ aiEmployee: 'username', tasks: [] })`,
              },
              examples: [
                `ctx.ai.triggerTask({ aiEmployee: 'nathan', tasks: [], chatBoxUid: 'ai-chat-box-uid', open: true })`,
              ],
            },
            triggerModelTask: {
              type: 'function',
              description:
                'Trigger a task from a Flow model by uid and 0-based task index. This is fire-and-forget and does not return a task result.',
              detail:
                '(uid: string, taskIndex: number, options?: { auto?: boolean; open?: boolean; attachments?: Attachment[] }) => void',
              completion: {
                insertText: `ctx.ai.triggerModelTask('flow-model-uid', 0)`,
              },
              examples: [`ctx.ai.triggerModelTask('flow-model-uid', 0)`],
            },
            tools: {
              type: 'object',
              description: 'Frontend tools exposed by the current JS block.',
              properties: {
                register: {
                  type: 'function',
                  description:
                    'Register a frontend tool that becomes available when the current JS block is picked as AI context. Permission defaults to ASK; use ALLOW only for tools that are safe to run automatically.',
                  detail:
                    "(options: { name: string; title?: string; description: string; permission?: 'ASK' | 'ALLOW'; inputSchema?: object; execute: (args: unknown) => unknown | Promise<unknown> }) => void",
                  completion: {
                    insertText: `ctx.ai.tools.register({
  name: 'my_tool',
  description: 'Describe when the AI should use this tool.',
  permission: 'ASK',
  inputSchema: { type: 'object', properties: {} },
  async execute(args) {
    return args;
  },
})`,
                  },
                },
              },
            },
          },
        },
      },
    });

    const BaseContext = RunJSContextRegistry.resolve(version, 'JSBlockModel') ?? FlowRunJSContext;
    class AIJSBlockRunJSContext extends BaseContext {
      constructor(delegate: unknown) {
        super(delegate);
        const frontendTools = getFrontendToolRegistry(this.app);
        const blockUid = this.model?.uid;
        if (!frontendTools || typeof blockUid !== 'string' || !blockUid) {
          return;
        }

        frontendTools.clear(blockUid);
        const currentAI = this.ai && typeof this.ai === 'object' ? this.ai : {};
        this.defineProperty('ai', {
          value: {
            ...currentAI,
            tools: {
              register: (registration: FrontendToolRegistration) => frontendTools.register(blockUid, registration),
            },
          },
        });
      }
    }
    RunJSContextRegistry.register(
      version,
      'JSBlockModel',
      AIJSBlockRunJSContext,
      RunJSContextRegistry.getMeta(version, 'JSBlockModel'),
    );
  });
};

export const registerPluginAIRunJSFacade = (
  context: AIEmployeeRunJSFlowContext,
  aiManager: AIEmployeeRunJSFacadeManager,
) => {
  context.defineProperty('ai', {
    value: {
      uploadFile: aiManager.uploadFile.bind(aiManager),
      triggerTask: aiManager.triggerTask.bind(aiManager),
      triggerModelTask: aiManager.triggerModelTask.bind(aiManager),
    },
  });
  registerPluginAIRunJSContextContribution();
};
