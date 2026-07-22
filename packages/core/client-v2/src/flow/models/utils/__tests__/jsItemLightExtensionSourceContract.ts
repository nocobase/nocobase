/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel, FlowSettingsContext } from '@nocobase/flow-engine';
import { expect, vi } from 'vitest';

import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';

export async function assertJSItemLightExtensionSourceContract(options: {
  model: FlowModel;
  sourceBinding: Record<string, unknown>;
  settings: Record<string, unknown>;
  settingsComponent: string;
  settingKey: string;
  settingTitle: string;
  updatedValue: unknown;
}) {
  const { model, sourceBinding, settings, settingsComponent, settingKey, settingTitle, updatedValue } = options;
  const flow = model.getFlow('jsSettings');
  const sourceModeStep = flow?.steps?.sourceMode;
  const sourceBindingStep = flow?.steps?.sourceBinding;
  const runJsStep = flow?.steps?.runJs;
  const listSourceMenuItems = vi.fn(async () => []);

  RunJSSourceResolverRegistry.registerResolver({
    sourceMode: 'light-extension',
    resolve: () => ({ code: '' }),
    getSettingsDescriptor: async () => ({
      entryId: String(sourceBinding.entryId),
      settingsSchemaHash: 'test-schema',
      schema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.keys(settings).map((key) => [key, { title: key === settingKey ? settingTitle : key }]),
        ),
      },
      defaults: settings,
    }),
    listSourceMenuItems,
  });
  await (
    sourceModeStep?.uiMode as { props?: { loadItems?: (input: unknown) => Promise<unknown> } }
  )?.props?.loadItems?.({
    params: { sourceMode: 'inline' },
    defaultParams: {},
    t: (key: string) => key,
  });

  expect(sourceModeStep?.useRawParams).toBe(true);
  expect(listSourceMenuItems).toHaveBeenCalledWith(expect.objectContaining({ kind: 'js-item' }));
  expect(sourceModeStep?.uiSchema?.sourceMode).toMatchObject({
    'x-component': 'JSItemLightExtensionFullSourceField',
    'x-component-props': { kind: 'js-item' },
  });
  expect(sourceModeStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
  expect(sourceModeStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
  expect(sourceBindingStep).toMatchObject({
    hideInSettings: true,
    uiSchema: {
      sourceBinding: {
        'x-component': 'JSItemLightExtensionFullSourceField',
        'x-component-props': { kind: 'js-item' },
      },
    },
  });
  expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
  expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
  expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');

  const settingsContext = model.context as FlowSettingsContext<FlowModel>;
  expect(sourceModeStep?.defaultParams?.(settingsContext)).toEqual({
    sourceMode: 'inline',
    sourceBinding: undefined,
    settings: {},
  });
  await expect(
    sourceModeStep?.beforeParamsSave?.(settingsContext, { sourceMode: 'light-extension' }, {}),
  ).rejects.toThrow('Light extension source binding is required.');

  await sourceModeStep?.beforeParamsSave?.(
    settingsContext,
    { sourceMode: 'light-extension', sourceBinding, settings },
    {},
  );
  expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
    sourceMode: 'light-extension',
    sourceBinding,
    settings: {},
  });

  const runtimeSteps = await model.getRuntimeFlowSettingSteps('jsSettings');
  const settingStep = Object.values(runtimeSteps || {}).find((step) => step.title === settingTitle);
  settingStep?.beforeParamsSave?.(settingsContext, { value: updatedValue });

  expect(settingStep?.uiSchema?.value?.['x-component']).toBe(settingsComponent);
  expect(settingStep?.persistParams).toBe(false);
  expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
    settings: {
      [settingKey]: updatedValue,
    },
  });
  expect(model.getStepParams('jsSettings', 'settings')).toBeUndefined();
}
