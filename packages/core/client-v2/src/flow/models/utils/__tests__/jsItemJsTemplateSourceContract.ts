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

export async function assertJSItemJsTemplateSourceContract(options: {
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
    sourceMode: 'js-template',
    resolve: () => ({ code: '' }),
    getSettingsDescriptor: async () => ({
      entryId: String(sourceBinding.templateId),
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
  await expect(sourceModeStep?.beforeParamsSave?.(settingsContext, { sourceMode: 'js-template' }, {})).rejects.toThrow(
    'JS Template source binding is required.',
  );

  await sourceModeStep?.beforeParamsSave?.(settingsContext, { sourceMode: 'js-template', sourceBinding, settings }, {});
  expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
    sourceMode: 'js-template',
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
