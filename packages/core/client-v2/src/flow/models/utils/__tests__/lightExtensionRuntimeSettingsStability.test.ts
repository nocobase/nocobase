/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, getFlowSettingSteps, type FlowSettingsContext, type StepDefinition } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSSourceResolverRegistry, type RunJSSourceSettingsDescriptor } from '../../../components/runjs-source';
import { JSBlockModel } from '../../blocks/js-block/JSBlock';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_stability',
  entryId: 'entry_stability',
  kind: 'js-block',
};

const SETTINGS_DESCRIPTOR: RunJSSourceSettingsDescriptor = {
  entryId: 'entry_stability',
  settingsSchemaHash: 'schema_stability_v1',
  defaults: {
    mode: 1,
    mode1Options: {
      message: 'Mode 1',
    },
    mode2Options: {
      color: '#1677ff',
    },
  },
  schema: {
    type: 'object',
    properties: {
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
    },
  },
};

function getStepByTitle(steps: Record<string, StepDefinition>, title: string): StepDefinition | undefined {
  return Object.values(steps).find((step) => step.title === title);
}

describe('light extension runtime settings stability', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
    vi.restoreAllMocks();
  });

  it('keeps one mode save within the deterministic event, rebuild and request budgets', async () => {
    const runtimeResolve = vi.fn();
    const artifactGet = vi.fn();
    const listSelectable = vi.fn();
    const getSettingsDescriptor = vi.fn(async () => SETTINGS_DESCRIPTOR);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor,
      resolve: async () => {
        runtimeResolve();
        artifactGet();
        return { code: '' };
      },
      listSourceMenuItems: async () => {
        listSelectable();
        return [];
      },
    });

    const engine = new FlowEngine();
    engine.registerModels({ JSBlockModel });
    const model = engine.createModel<JSBlockModel>({
      use: 'JSBlockModel',
      uid: 'js-block-runtime-settings-stability',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: SOURCE_BINDING,
            settings: SETTINGS_DESCRIPTOR.defaults,
          },
        },
      },
    });
    const getRuntimeFlowSettingSteps = vi.spyOn(model, 'getRuntimeFlowSettingSteps');
    const emit = vi.spyOn(model.emitter, 'emit');
    const saveStepParams = vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);
    const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);

    const flow = model.getFlow('jsSettings');
    expect(flow).toBeDefined();
    if (!flow) {
      throw new Error('JS Block settings flow is missing');
    }
    const initialSteps = await getFlowSettingSteps(model, flow, 'jsSettings');
    const modeStep = getStepByTitle(initialSteps, 'Mode');
    const initialMode1Step = getStepByTitle(initialSteps, 'Mode 1 settings');
    const initialMode2Step = getStepByTitle(initialSteps, 'Mode 2 settings');
    expect(await initialMode1Step?.hideInSettings?.(model.context as FlowSettingsContext<JSBlockModel>)).toBe(false);
    expect(await initialMode2Step?.hideInSettings?.(model.context as FlowSettingsContext<JSBlockModel>)).toBe(true);

    modeStep?.beforeParamsSave?.(model.context as FlowSettingsContext<JSBlockModel>, { value: 2 }, { value: 1 });
    await model.saveStepParams();
    await modeStep?.afterParamsSave?.(model.context as FlowSettingsContext<JSBlockModel>, { value: 2 }, { value: 1 });

    const rebuiltSteps = await getFlowSettingSteps(model, flow, 'jsSettings');
    const rebuiltMode1Step = getStepByTitle(rebuiltSteps, 'Mode 1 settings');
    const rebuiltMode2Step = getStepByTitle(rebuiltSteps, 'Mode 2 settings');
    expect(await rebuiltMode1Step?.hideInSettings?.(model.context as FlowSettingsContext<JSBlockModel>)).toBe(true);
    expect(await rebuiltMode2Step?.hideInSettings?.(model.context as FlowSettingsContext<JSBlockModel>)).toBe(false);

    const stepParamEvents = () => emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged');
    expect(stepParamEvents()).toHaveLength(1);
    expect(saveStepParams).toHaveBeenCalledOnce();
    expect(rerender).toHaveBeenCalledOnce();
    expect(getRuntimeFlowSettingSteps).toHaveBeenCalledTimes(2);
    expect(getSettingsDescriptor).toHaveBeenCalledTimes(2);
    expect(runtimeResolve).not.toHaveBeenCalled();
    expect(artifactGet).not.toHaveBeenCalled();
    expect(listSelectable).not.toHaveBeenCalled();

    const stableCounts = {
      events: stepParamEvents().length,
      runtimeStepBuilds: getRuntimeFlowSettingSteps.mock.calls.length,
      descriptorReads: getSettingsDescriptor.mock.calls.length,
    };
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(stepParamEvents()).toHaveLength(stableCounts.events);
    expect(getRuntimeFlowSettingSteps).toHaveBeenCalledTimes(stableCounts.runtimeStepBuilds);
    expect(getSettingsDescriptor).toHaveBeenCalledTimes(stableCounts.descriptorReads);
    expect(runtimeResolve).not.toHaveBeenCalled();
    expect(artifactGet).not.toHaveBeenCalled();
    expect(listSelectable).not.toHaveBeenCalled();
  });
});
