/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { buildTriggerWorkflows, getWorkflowCollectionName, getWorkflowOptionFilter } from '../triggerWorkflows';

const flowState = vi.hoisted(() => ({
  submitFlows: [] as Array<{ key: string; steps: Record<string, { handler: (...args: unknown[]) => unknown }> }>,
  updateFlows: [] as Array<{ key: string; steps: Record<string, { handler: (...args: unknown[]) => unknown }> }>,
}));

vi.mock('@nocobase/client-v2', () => ({
  FormSubmitActionModel: {
    registerFlow(flow: { key: string; steps: Record<string, { handler: (...args: unknown[]) => unknown }> }) {
      flowState.submitFlows.push(flow);
    },
  },
  UpdateRecordActionModel: {
    registerFlow(flow: { key: string; steps: Record<string, { handler: (...args: unknown[]) => unknown }> }) {
      flowState.updateFlows.push(flow);
    },
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  tExpr: (key: string) => key,
  useFlowContext: vi.fn(),
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
    },
  }),
}));

describe('trigger workflows action settings', () => {
  it('serializes workflow keys without the deprecated context suffix', () => {
    const legacyGroup: Array<{ workflowKey?: string; context?: string }> = [
      { workflowKey: 'a', context: 'deprecated' },
      { workflowKey: undefined, context: 'ignored' },
      { workflowKey: 'b' },
    ];

    expect(buildTriggerWorkflows(legacyGroup)).toBe('a,b');
    expect(buildTriggerWorkflows()).toBeUndefined();
  });

  it('keeps save request params compatible for submit and update actions', () => {
    const submitFlow = flowState.submitFlows.find((flow) => flow.key === 'formTriggerWorkflowsActionSettings');
    const updateFlow = flowState.updateFlows.find((flow) => flow.key === 'recordTriggerWorkflowsActionSettings');
    const submitModel = { setSaveRequestConfig: vi.fn() };
    const updateModel = { setSaveRequestConfig: vi.fn() };

    submitFlow?.steps.setTriggerWorkflows.handler({ model: submitModel }, { group: [{ workflowKey: 'a' }] });
    updateFlow?.steps.setTriggerWorkflows.handler({ model: updateModel }, { group: [{ workflowKey: 'b' }] });

    expect(submitModel.setSaveRequestConfig).toHaveBeenCalledWith({ params: { triggerWorkflows: 'a' } });
    expect(updateModel.setSaveRequestConfig).toHaveBeenCalledWith({ params: { triggerWorkflows: 'b' } });
  });

  it('builds workflow collection names with the data source prefix only when needed', () => {
    expect(getWorkflowCollectionName({ name: 'posts', dataSourceKey: 'main' })).toBe('posts');
    expect(getWorkflowCollectionName({ name: 'posts', dataSourceKey: 'external' })).toBe('external:posts');
    expect(getWorkflowCollectionName()).toBeUndefined();
  });

  it('filters workflows to triggers that support form action binding while keeping the current value visible', () => {
    const filter = getWorkflowOptionFilter(
      {
        getTriggerOptions(type?: string) {
          if (type === 'action') {
            return {
              actionTriggerableScope(config: Record<string, unknown>, scope: string) {
                return scope === 'form' && config.global !== true;
              },
            };
          }
          return undefined;
        },
      },
      'selected-missing-trigger',
    );

    expect(filter({ key: 'available', type: 'action', config: { global: false } })).toBe(true);
    expect(filter({ key: 'global', type: 'action', config: { global: true } })).toBe(false);
    expect(filter({ key: 'selected-missing-trigger', type: 'missing' })).toBe(true);
    expect(filter({ key: 'missing', type: 'missing' })).toBe(false);
  });
});
