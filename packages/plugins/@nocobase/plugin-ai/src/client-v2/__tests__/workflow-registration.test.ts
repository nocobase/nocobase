/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  AI_EMPLOYEE_INSTRUCTION_TYPE,
  AI_EMPLOYEE_TRIGGER_TYPE,
  AI_WORKFLOW_GROUP,
  LLM_INSTRUCTION_TYPE,
} from '../workflow/constants';
import AIEmployeeInstruction from '../workflow/nodes/employee';
import LLMInstruction from '../workflow/nodes/llm';
import { registerPluginAIWorkflow } from '../workflow/register';
import AIEmployeeTrigger from '../workflow/triggers/ai-employee';

describe('plugin-ai workflow v2 registration', () => {
  it('registers the AI group, workflow nodes, and trigger when workflow v2 is available', () => {
    const workflowPlugin = {
      registerInstructionGroup: vi.fn(),
      registerInstruction: vi.fn(),
      registerTrigger: vi.fn(),
    };
    const pluginManager = {
      get: vi.fn(() => workflowPlugin),
    } as unknown as Parameters<typeof registerPluginAIWorkflow>[0];

    registerPluginAIWorkflow(pluginManager);

    expect(workflowPlugin.registerInstructionGroup).toHaveBeenCalledWith(AI_WORKFLOW_GROUP, {
      key: AI_WORKFLOW_GROUP,
      label: expect.stringContaining('AI'),
    });
    expect(workflowPlugin.registerInstruction).toHaveBeenCalledWith(LLM_INSTRUCTION_TYPE, LLMInstruction);
    expect(workflowPlugin.registerInstruction).toHaveBeenCalledWith(
      AI_EMPLOYEE_INSTRUCTION_TYPE,
      AIEmployeeInstruction,
    );
    expect(workflowPlugin.registerTrigger).toHaveBeenCalledWith(AI_EMPLOYEE_TRIGGER_TYPE, AIEmployeeTrigger);
  });

  it('skips workflow registration when workflow v2 is absent', () => {
    const pluginManager = {
      get: vi.fn(() => undefined),
    } as unknown as Parameters<typeof registerPluginAIWorkflow>[0];

    expect(() => registerPluginAIWorkflow(pluginManager)).not.toThrow();
  });

  it('keeps LLM output variables aligned with v1', () => {
    const instruction = new LLMInstruction();

    expect(instruction.useVariables({ key: 'llm_1', title: 'LLM' })?.children?.map((item) => item.value)).toEqual([
      'content',
      'structuredContent',
      'additionalKwargs',
    ]);
  });

  it('keeps LLM default messages aligned with v1', () => {
    const instruction = new LLMInstruction();

    expect(instruction.createDefaultConfig()).toEqual({
      messages: [{ role: 'user', content: [{ type: 'text' }] }],
    });
  });

  it('parses AI employee structured output variables without throwing on invalid JSON', () => {
    const instruction = new AIEmployeeInstruction();

    expect(
      instruction.useVariables({
        key: 'employee_1',
        title: 'AI employee',
        config: {
          structuredOutput: {
            schema: {
              type: 'object',
              properties: {
                translation: {
                  type: 'string',
                  title: 'Translation',
                },
              },
            },
          },
        },
      }),
    ).toEqual({
      label: 'AI employee',
      value: 'employee_1',
      children: [{ label: 'Translation', value: 'translation', children: undefined }],
    });
    expect(
      instruction.useVariables({
        key: 'employee_2',
        config: {
          structuredOutput: {
            schema: '{ invalid',
          },
        },
      }),
    ).toBeNull();
  });

  it('validates AI employee trigger parameters', () => {
    const trigger = new AIEmployeeTrigger();

    expect(trigger.validate({ parameters: [] })).toBe(true);
    expect(
      trigger.validate({
        parameters: [
          {
            name: 'input_text',
            type: 'enum',
            enumOptions: ['A', 'B'],
            required: true,
          },
        ],
      }),
    ).toBe(true);
    expect(
      trigger.validate({
        parameters: [
          {
            name: 'bad-name',
            type: 'string',
          },
        ],
      }),
    ).toBe(false);
  });
});
