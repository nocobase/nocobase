/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel, FlowSettingsContext } from '@nocobase/flow-engine';
import { expect } from 'vitest';

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
  });

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
    settings,
  });

  const runtimeSteps = await model.getRuntimeFlowSettingSteps('jsSettings');
  const settingStep = Object.values(runtimeSteps || {}).find((step) => step.title === settingTitle);
  settingStep?.beforeParamsSave?.(settingsContext, { value: updatedValue });

  expect(settingStep?.uiSchema?.value?.['x-component']).toBe(settingsComponent);
  expect(settingStep?.persistParams).toBe(false);
  expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
    settings: {
      ...settings,
      [settingKey]: updatedValue,
    },
  });
  expect(model.getStepParams('jsSettings', 'settings')).toBeUndefined();
}
