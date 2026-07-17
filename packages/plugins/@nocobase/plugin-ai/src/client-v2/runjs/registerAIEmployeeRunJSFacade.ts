/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerRunJSContextContribution } from '@nocobase/flow-engine';

type AIEmployeeRunJSFlowContext = {
  defineProperty: (name: string, descriptor: { value: unknown }) => void;
};

type AIEmployeeRunJSFacadeManager = {
  triggerTask: (...args: unknown[]) => void;
  triggerModelTask: (...args: unknown[]) => void;
};

let runJSContextContributionRegistered = false;

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
