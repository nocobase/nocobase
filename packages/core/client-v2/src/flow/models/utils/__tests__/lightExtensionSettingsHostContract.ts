/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowModel, type FlowSettingsContext, type StepDefinition } from '@nocobase/flow-engine';
import { expect, vi } from 'vitest';

import {
  RunJSSourceResolverRegistry,
  type RunJSSourceBinding,
  type RunJSSourceSettingsDescriptor,
} from '../../../components/runjs-source';

const INITIAL_SETTINGS = {
  label: 'Saved label',
  pageSize: 50,
  displayOptions: {
    pageSize: 40,
    color: 'red',
    obsolete: true,
  },
};

function createDescriptor(entryId: string): RunJSSourceSettingsDescriptor {
  return {
    entryId,
    settingsSchemaHash: `${entryId}-schema-v1`,
    defaults: {
      label: 'Default label',
      pageSize: 20,
      displayOptions: {
        pageSize: 20,
        color: 'blue',
      },
    },
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          title: 'Label',
        },
        pageSize: {
          type: 'integer',
          title: 'Page size',
        },
        displayOptions: {
          type: 'object',
          title: 'Display options',
          properties: {
            pageSize: {
              type: 'integer',
            },
            color: {
              type: 'string',
            },
            obsolete: {
              type: 'boolean',
            },
          },
        },
      },
    },
  };
}

function createUpdatedDescriptor(entryId: string): RunJSSourceSettingsDescriptor {
  return {
    entryId,
    settingsSchemaHash: `${entryId}-schema-v2`,
    defaults: {
      label: 'Changed default',
      pageSize: 10,
      displayOptions: {
        pageSize: 10,
        color: 'green',
        density: 'compact',
      },
      showTitle: true,
    },
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          title: 'Updated label',
        },
        pageSize: {
          type: 'integer',
          title: 'Updated page size',
        },
        displayOptions: {
          type: 'object',
          title: 'Updated display options',
          properties: {
            pageSize: {
              type: 'integer',
            },
            color: {
              type: 'string',
            },
            density: {
              type: 'string',
            },
          },
        },
        showTitle: {
          type: 'boolean',
          title: 'Show title',
        },
      },
    },
  };
}

function createNextDescriptor(entryId: string): RunJSSourceSettingsDescriptor {
  return {
    entryId,
    settingsSchemaHash: `${entryId}-schema-v1`,
    defaults: {
      label: 'Next entry',
      pageSize: 5,
      displayOptions: {
        pageSize: 5,
        color: 'purple',
      },
    },
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          title: 'Label',
        },
        pageSize: {
          type: 'integer',
          title: 'Page size',
        },
        displayOptions: {
          type: 'object',
          title: 'Display options',
          properties: {
            pageSize: {
              type: 'integer',
            },
            color: {
              type: 'string',
            },
          },
        },
      },
    },
  };
}

function getStepByTitle(steps: Record<string, StepDefinition> | undefined, title: string) {
  return Object.entries(steps || {}).find(([, step]) => step.title === title);
}

function getRunJs(model: FlowModel, flowKey: string): Record<string, unknown> {
  return (model.getStepParams(flowKey, 'runJs') || {}) as Record<string, unknown>;
}

export async function assertLightExtensionSettingsHostContract(options: {
  model: FlowModel;
  flowKey: string;
  settingsComponent: string;
  sourceBinding: RunJSSourceBinding;
  nextSourceBinding: RunJSSourceBinding;
}) {
  const { model, flowKey, settingsComponent, sourceBinding, nextSourceBinding } = options;
  let currentDescriptor = createDescriptor(String(sourceBinding.entryId));
  const nextDescriptor = createNextDescriptor(String(nextSourceBinding.entryId));

  RunJSSourceResolverRegistry.registerResolver({
    sourceMode: 'light-extension',
    resolve: () => ({ code: '' }),
    getSettingsDescriptor: async (input) =>
      input.sourceBinding.entryId === nextSourceBinding.entryId ? nextDescriptor : currentDescriptor,
  });

  model.setStepParams(flowKey, {
    runJs: {
      ...getRunJs(model, flowKey),
      sourceMode: 'light-extension',
      sourceBinding,
      settings: INITIAL_SETTINGS,
    },
  });

  const initialSteps = await model.getRuntimeFlowSettingSteps(flowKey);
  const initialLabelStep = getStepByTitle(initialSteps, 'Label');
  const displayOptionsStep = getStepByTitle(initialSteps, 'Display options');

  expect(initialLabelStep?.[1].uiSchema?.value?.['x-component']).toBe(settingsComponent);
  expect(displayOptionsStep?.[1].persistParams).toBe(false);

  const emit = vi.spyOn(model.emitter, 'emit');
  displayOptionsStep?.[1].beforeParamsSave?.(model.context as FlowSettingsContext<FlowModel>, {
    value: {
      pageSize: 30,
      color: 'orange',
    },
  });

  expect(getRunJs(model, flowKey).settings).toEqual({
    label: 'Saved label',
    pageSize: 50,
    displayOptions: {
      pageSize: 30,
      color: 'orange',
    },
  });
  expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
  expect(Object.keys(model.getStepParams(flowKey) || {})).toEqual(['runJs']);
  expect(model.getStepParams(flowKey, 'settings')).toBeUndefined();
  for (const stepKey of Object.keys(initialSteps || {})) {
    expect(model.getStepParams(flowKey, stepKey)).toBeUndefined();
  }

  currentDescriptor = createUpdatedDescriptor(String(sourceBinding.entryId));
  const updatedSteps = await model.getRuntimeFlowSettingSteps(flowKey);
  const updatedLabelStep = getStepByTitle(updatedSteps, 'Updated label');
  expect(updatedLabelStep?.[0]).toBe(initialLabelStep?.[0]);

  emit.mockClear();
  const sourceModeStep = model.getFlow(flowKey)?.steps?.sourceMode;
  await sourceModeStep?.beforeParamsSave?.(
    model.context as FlowSettingsContext<FlowModel>,
    {
      sourceMode: 'light-extension',
      sourceBinding,
      settings: getRunJs(model, flowKey).settings,
    },
    {},
  );

  expect(getRunJs(model, flowKey).settings).toEqual({
    label: 'Saved label',
    pageSize: 50,
    displayOptions: {
      pageSize: 30,
      color: 'orange',
      density: 'compact',
    },
    showTitle: true,
  });
  expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);

  emit.mockClear();
  await sourceModeStep?.beforeParamsSave?.(
    model.context as FlowSettingsContext<FlowModel>,
    {
      sourceMode: 'light-extension',
      sourceBinding: nextSourceBinding,
      settings: {
        label: 'Stale submitted label',
        pageSize: 999,
        displayOptions: {
          pageSize: 999,
          color: 'black',
        },
      },
    },
    {},
  );

  expect(getRunJs(model, flowKey).settings).toEqual(nextDescriptor.defaults);
  expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
  expect(Object.keys(model.getStepParams(flowKey) || {})).toEqual(['runJs']);

  const nextSteps = await model.getRuntimeFlowSettingSteps(flowKey);
  const nextLabelStep = getStepByTitle(nextSteps, 'Label');
  expect(nextLabelStep?.[0]).not.toBe(initialLabelStep?.[0]);
}
