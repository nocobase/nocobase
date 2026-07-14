/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowModel, type FlowSettingsContext, type StepDefinition } from '@nocobase/flow-engine';
import { getLightExtensionSettingStepKey } from '@nocobase/runjs/settings';
import React from 'react';
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
      mode: 1,
      mode1Options: {
        message: 'Mode 1',
      },
      mode2Options: {
        color: '#1677ff',
      },
      tags: ['default'],
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
        mode: {
          type: 'integer',
          title: 'Mode',
          enum: [1, 2],
        },
        mode1Options: {
          type: 'object',
          title: 'Mode 1 settings',
          'x-visible-when': {
            path: 'mode',
            operator: '$eq',
            value: 1,
          },
          properties: {
            message: {
              type: 'string',
            },
          },
        },
        mode2Options: {
          type: 'object',
          title: 'Mode 2 settings',
          'x-visible-when': {
            path: 'mode',
            operator: '$eq',
            value: 2,
          },
          properties: {
            color: {
              type: 'string',
            },
          },
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
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

function getButtons(node: React.ReactNode): React.ReactElement<{ onClick?: () => void }>[] {
  if (!React.isValidElement(node)) {
    return [];
  }
  const element = node as React.ReactElement<{ children?: React.ReactNode; onClick?: () => void }>;
  return [
    ...(element.type === 'button' ? [element] : []),
    ...React.Children.toArray(element.props.children).flatMap((child) => getButtons(child)),
  ];
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
  const currentProperties = currentDescriptor.schema?.properties as Record<string, Record<string, unknown>>;

  expect(initialLabelStep?.[1].uiSchema?.value?.['x-component']).toBe(settingsComponent);
  expect(displayOptionsStep?.[1].persistParams).toBe(false);
  expect(displayOptionsStep?.[1].uiSchema?.value?.['x-component-props']).toMatchObject({
    fieldName: 'displayOptions',
    fieldPath: ['displayOptions'],
    fieldSchema: currentProperties.displayOptions,
    rootSchema: currentDescriptor.schema,
    savedRootValue: INITIAL_SETTINGS,
    descriptorDefaults: currentDescriptor.defaults,
  });

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

  const modeStep = getStepByTitle(nextSteps, 'Mode');
  const mode1Step = getStepByTitle(nextSteps, 'Mode 1 settings');
  const mode2Step = getStepByTitle(nextSteps, 'Mode 2 settings');
  const tagsStep = getStepByTitle(nextSteps, 'tags');
  expect(Object.values(nextSteps || {}).map((step) => step.title)).toEqual([
    'Label',
    'Page size',
    'Display options',
    'Mode',
    'Mode 1 settings',
    'Mode 2 settings',
    'tags',
  ]);
  expect(modeStep?.[1].hideInSettings).toBeUndefined();
  expect(await mode1Step?.[1].hideInSettings?.(model.context as FlowSettingsContext<FlowModel>)).toBe(false);
  expect(await mode2Step?.[1].hideInSettings?.(model.context as FlowSettingsContext<FlowModel>)).toBe(true);
  expect(tagsStep?.[1].uiSchema?.value?.['x-component']).toBe(settingsComponent);

  const settingsBeforeCancelledDraft = JSON.parse(JSON.stringify(getRunJs(model, flowKey).settings));
  expect(await mode2Step?.[1].hideInSettings?.(model.context as FlowSettingsContext<FlowModel>)).toBe(true);
  expect(getRunJs(model, flowKey).settings).toEqual(settingsBeforeCancelledDraft);

  emit.mockClear();
  modeStep?.[1].beforeParamsSave?.(model.context as FlowSettingsContext<FlowModel>, { value: 2 });
  expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
  expect(getRunJs(model, flowKey).settings).toMatchObject({
    mode: 2,
    mode1Options: { message: 'Mode 1' },
    mode2Options: { color: '#1677ff' },
  });

  const switchedSteps = await model.getRuntimeFlowSettingSteps(flowKey);
  const switchedMode1Step = getStepByTitle(switchedSteps, 'Mode 1 settings');
  const switchedMode2Step = getStepByTitle(switchedSteps, 'Mode 2 settings');
  expect(await switchedMode1Step?.[1].hideInSettings?.(model.context as FlowSettingsContext<FlowModel>)).toBe(true);
  expect(await switchedMode2Step?.[1].hideInSettings?.(model.context as FlowSettingsContext<FlowModel>)).toBe(false);

  const nextProperties = nextDescriptor.schema?.properties as Record<string, Record<string, unknown>>;
  nextProperties.mode1Options = {
    ...nextProperties.mode1Options,
    title: 'Renamed Mode 1 settings',
    'x-visible-when': {
      path: 'mode',
      operator: '$ne',
      value: 2,
    },
  };
  const renamedSteps = await model.getRuntimeFlowSettingSteps(flowKey);
  expect(getStepByTitle(renamedSteps, 'Renamed Mode 1 settings')?.[0]).toBe(mode1Step?.[0]);

  emit.mockClear();
  tagsStep?.[1].beforeParamsSave?.(model.context as FlowSettingsContext<FlowModel>, { value: ['saved'] });
  expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
  expect(getRunJs(model, flowKey).settings).toMatchObject({
    tags: ['saved'],
    mode1Options: { message: 'Mode 1' },
  });

  nextProperties.mode1Options = {
    ...nextProperties.mode1Options,
    'x-visible-when': {
      path: 'mode',
      operator: '$not',
      value: 2,
    },
  };
  const invalidConditionSteps = await model.getRuntimeFlowSettingSteps(flowKey);
  const invalidConditionStep = getStepByTitle(invalidConditionSteps, 'Renamed Mode 1 settings');
  let conditionError: unknown;
  try {
    invalidConditionStep?.[1].hideInSettings?.(model.context as FlowSettingsContext<FlowModel>);
  } catch (error) {
    conditionError = error;
  }
  expect(conditionError).toMatchObject({
    code: 'LIGHT_EXTENSION_SETTINGS_CONDITION_INVALID',
    entryId: nextDescriptor.entryId,
    propertyPath: 'mode1Options',
  });

  currentDescriptor = {
    entryId: String(sourceBinding.entryId),
    settingsSchemaHash: 'required-schema-v1',
    defaults: {},
    schema: {
      type: 'object',
      required: ['apiKey', 'options'],
      properties: {
        apiKey: { type: 'string', title: 'API key' },
        options: {
          type: 'object',
          title: 'Options',
          required: ['limit'],
          properties: { limit: { type: 'integer' } },
        },
      },
    },
  };
  const info = vi.fn();
  model.context.defineProperty('message', { value: { info, error: vi.fn() } });
  const openFlowSettings = vi.spyOn(model, 'openFlowSettings').mockResolvedValue(true);
  const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);
  await sourceModeStep?.beforeParamsSave?.(
    model.context as FlowSettingsContext<FlowModel>,
    {
      sourceMode: 'light-extension',
      sourceBinding,
      settings: {},
    },
    {},
  );

  expect(getRunJs(model, flowKey)).toMatchObject({
    sourceMode: 'light-extension',
    sourceBinding,
    settings: {},
  });
  await sourceModeStep?.afterParamsSave?.(model.context as FlowSettingsContext<FlowModel>, {}, {});
  expect(rerender).toHaveBeenCalled();
  expect(info).toHaveBeenCalledTimes(1);
  expect(openFlowSettings).not.toHaveBeenCalled();

  const messageOptions = info.mock.calls[0][0] as { content?: React.ReactNode };
  const buttons = getButtons(messageOptions.content);
  expect(buttons.map((button) => button.props.children)).toEqual(['API key', 'Options']);
  buttons[0].props.onClick?.();
  buttons[1].props.onClick?.();
  expect(openFlowSettings).toHaveBeenNthCalledWith(1, {
    flowKey,
    stepKey: getLightExtensionSettingStepKey(String(sourceBinding.entryId), 'apiKey'),
  });
  expect(openFlowSettings).toHaveBeenNthCalledWith(2, {
    flowKey,
    stepKey: getLightExtensionSettingStepKey(String(sourceBinding.entryId), 'options'),
  });
}
