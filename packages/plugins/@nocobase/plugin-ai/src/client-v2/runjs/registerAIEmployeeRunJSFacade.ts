/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JSBlockModel } from '@nocobase/client-v2';
import { registerRunJSContextContribution } from '@nocobase/flow-engine';
import { getFrontendToolRegistry, type FrontendToolRegistration } from '../manager/frontend-tool-registry';

type AIEmployeeRunJSFlowContext = {
  defineProperty: (name: string, descriptor: { value: unknown }) => void;
};

type AIEmployeeRunJSFacadeManager = {
  triggerTask: (...args: unknown[]) => void;
  triggerModelTask: (...args: unknown[]) => void;
};

let runJSContextContributionRegistered = false;
let jsBlockToolFlowRegistered = false;

export const registerPluginAIRunJSContextContribution = () => {
  if (runJSContextContributionRegistered) {
    return;
  }
  runJSContextContributionRegistered = true;
  registerRunJSContextContribution(({ FlowRunJSContext }) => {
    FlowRunJSContext.define({
      properties: {
        ai: {
          description: 'AI employee task API.',
          detail: 'AI employee facade',
          properties: {
            triggerTask: {
              type: 'function',
              description: 'Trigger an AI employee task. This is fire-and-forget and does not return a task result.',
              detail:
                '(options: { aiEmployee?: string | AIEmployee; tasks?: Task[]; auto?: boolean; open?: boolean }) => void',
              completion: {
                insertText: `ctx.ai.triggerTask({ aiEmployee: 'username', tasks: [] })`,
              },
              examples: [`ctx.ai.triggerTask({ aiEmployee: 'nathan', tasks: [], open: true })`],
            },
            triggerModelTask: {
              type: 'function',
              description:
                'Trigger a task from a Flow model by uid and 0-based task index. This is fire-and-forget and does not return a task result.',
              detail: '(uid: string, taskIndex: number, options?: { auto?: boolean; open?: boolean }) => void',
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
  });
};

export const registerPluginAIRunJSFacade = (
  context: AIEmployeeRunJSFlowContext,
  aiManager: AIEmployeeRunJSFacadeManager,
) => {
  context.defineProperty('ai', {
    value: {
      triggerTask: aiManager.triggerTask.bind(aiManager),
      triggerModelTask: aiManager.triggerModelTask.bind(aiManager),
    },
  });
  registerPluginAIRunJSContextContribution();
};

export const registerPluginAIJSBlockToolFlow = () => {
  if (jsBlockToolFlowRegistered) {
    return;
  }
  jsBlockToolFlowRegistered = true;
  JSBlockModel.registerFlow({
    key: 'aiFrontendTools',
    sort: -1000,
    steps: {
      setup: {
        handler(ctx) {
          const frontendTools = getFrontendToolRegistry(ctx.app);
          if (!frontendTools) {
            return;
          }

          const blockUid = ctx.model.uid;
          const modelContext = ctx.model.context;
          frontendTools.clear(blockUid);
          const currentAI = modelContext.ai && typeof modelContext.ai === 'object' ? modelContext.ai : {};
          modelContext.defineProperty('ai', {
            value: {
              ...currentAI,
              tools: {
                register: (registration: FrontendToolRegistration) => frontendTools.register(blockUid, registration),
              },
            },
          });
        },
      },
    },
  });
};
