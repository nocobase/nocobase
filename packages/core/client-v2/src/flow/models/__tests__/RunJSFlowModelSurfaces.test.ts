/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, type FlowSettingsContext, type StepDefinition } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RunJSSourceResolverRegistry } from '../../components/runjs-source';
import { RunJSEditorField, RunJSEditorRegistry, type RunJSSurfaceStyle } from '../../components/runjs-studio';
import { JSActionModel } from '../actions/JSActionModel';
import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from '../actions/JSActionSourceModeField';
import { JSCollectionActionModel } from '../actions/JSCollectionActionModel';
import { JSItemActionModel } from '../actions/JSItemActionModel';
import { JSRecordActionModel } from '../actions/JSRecordActionModel';
import { JSPageModel } from '../base/PageModel/JSPageModel';
import {
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from '../base/PageModel/JSPageSourceModeField';
import { FilterFormJSActionModel } from '../blocks/filter-form/FilterFormJSActionModel';
import { JSFormActionModel } from '../blocks/form/JSFormActionModel';
import { JSBlockModel } from '../blocks/js-block/JSBlock';
import { JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD } from '../blocks/js-block/JSBlockSourceModeField';
import { JSColumnModel } from '../blocks/table/JSColumnModel';
import { JSEditableFieldModel } from '../fields/JSEditableFieldModel';
import {
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from '../fields/JSFieldSourceModeField';
import { JSFieldModel } from '../fields/JSFieldModel';
import { JSItemModel } from '../fields/JSItemModel';
import {
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from '../fields/JSItemSourceModeField';
import { assertJSItemLightExtensionSourceContract } from '../utils/__tests__/jsItemLightExtensionSourceContract';
import { assertLightExtensionSettingsHostContract } from '../utils/__tests__/lightExtensionSettingsHostContract';

type SurfaceSpec = {
  name: string;
  modelClass: typeof FlowModel;
  flowKey: string;
  lightExtensionKind: 'js-block' | 'js-page' | 'js-action' | 'js-field' | 'js-item';
  surfaceStyle: RunJSSurfaceStyle;
  scene: string;
  sourceComponent?: string;
  settingsComponent: string;
  hasSourceBindingStep: boolean;
  minHeight?: string;
};

type CodeSchema = {
  'x-component'?: unknown;
  'x-component-props'?: Record<string, unknown>;
};

type RunJSUiMode = {
  props?: Record<string, unknown>;
};

type RunJSUiModeContext = {
  model: {
    context: {
      t: (key: string) => string;
    };
    getStepParams: () => Record<string, unknown>;
  };
};

type SerializedRunJSStep = {
  uiMode?: RunJSUiMode | ((ctx: RunJSUiModeContext) => RunJSUiMode | Promise<RunJSUiMode>);
};

const surfaces: SurfaceSpec[] = [
  {
    name: 'JSBlockModel',
    modelClass: JSBlockModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-block',
    surfaceStyle: 'render',
    scene: 'block',
    settingsComponent: JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: false,
    minHeight: '320px',
  },
  {
    name: 'JSFieldModel',
    modelClass: JSFieldModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSEditableFieldModel',
    modelClass: JSEditableFieldModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'formValue',
    sourceComponent: JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSItemModel',
    modelClass: JSItemModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-item',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSColumnModel',
    modelClass: JSColumnModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSItemActionModel',
    modelClass: JSItemActionModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-item',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSActionModel',
    modelClass: JSActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSRecordActionModel',
    modelClass: JSRecordActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSCollectionActionModel',
    modelClass: JSCollectionActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSFormActionModel',
    modelClass: JSFormActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'FilterFormJSActionModel',
    modelClass: FilterFormJSActionModel,
    flowKey: 'clickSettings',
    lightExtensionKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSPageModel',
    modelClass: JSPageModel,
    flowKey: 'jsSettings',
    lightExtensionKind: 'js-page',
    surfaceStyle: 'render',
    scene: 'page',
    sourceComponent: JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    settingsComponent: JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: false,
    minHeight: 'calc(100vh - 42px)',
  },
];

function getRunJsCodeSchema(spec: SurfaceSpec): CodeSchema {
  const flow = spec.modelClass.globalFlowRegistry.getFlow(spec.flowKey);
  const step = flow?.getStep('runJs');
  const uiSchema = step?.uiSchema;
  const codeSchema = uiSchema ? (uiSchema as Record<string, CodeSchema>).code : undefined;

  expect(flow, `${spec.name} ${spec.flowKey} flow`).toBeTruthy();
  expect(step, `${spec.name} runJs step`).toBeTruthy();
  expect(codeSchema, `${spec.name} code schema`).toBeTruthy();

  return codeSchema as CodeSchema;
}

function createSurfaceModel(spec: SurfaceSpec, runJs: Record<string, unknown> = {}): FlowModel {
  const engine = new FlowEngine();
  engine.registerModels({ [spec.name]: spec.modelClass });
  return engine.createModel({
    use: spec.name,
    uid: `${spec.name}-surface-contract`,
    stepParams: {
      [spec.flowKey]: {
        runJs,
      },
    },
  });
}

function getStepByTitle(steps: Record<string, StepDefinition> | undefined, title: string) {
  return Object.values(steps || {}).find((step) => step.title === title);
}

describe('RunJS FlowModel surfaces', () => {
  beforeEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSourceResolverRegistry.clear();
  });

  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSourceResolverRegistry.clear();
  });

  it.each(surfaces)('$name keeps canonical source, locator, and storage wiring', (spec) => {
    const flow = spec.modelClass.globalFlowRegistry.getFlow(spec.flowKey);
    const sourceModeStep = flow?.steps.sourceMode;
    const sourceBindingStep = flow?.steps.sourceBinding;
    const runJsStep = flow?.steps.runJs;
    const codeSchema = getRunJsCodeSchema(spec);
    const codeProps = codeSchema['x-component-props'];

    expect(codeSchema['x-component']).toBe(RunJSEditorField);
    expect(codeProps).toMatchObject({
      locatorFactory: 'flowModel.step',
      sourceMetadata: {
        lightExtensionKind: spec.lightExtensionKind,
      },
      surfaceStyle: spec.surfaceStyle,
      scene: spec.scene,
    });
    expect(codeProps?.paramPath || ['code']).toEqual(['code']);
    expect(codeProps?.versionPath || ['version']).toEqual(['version']);
    expect(sourceModeStep?.persistParams).toBe(false);
    expect(sourceModeStep?.useRawParams).toBe(true);
    expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');

    if (spec.sourceComponent) {
      expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component']).toBe(spec.sourceComponent);
      if (spec.lightExtensionKind !== 'js-page') {
        expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component-props']).toMatchObject({
          kind: spec.lightExtensionKind,
        });
      }
    } else {
      expect(sourceModeStep?.uiMode).toMatchObject({ type: 'cascadeMenu', key: 'sourceMode' });
    }

    if (spec.hasSourceBindingStep) {
      expect(sourceBindingStep?.hideInSettings).toBe(true);
      expect(sourceBindingStep?.uiSchema?.sourceBinding).toMatchObject({
        'x-component': spec.sourceComponent,
        'x-component-props': { kind: spec.lightExtensionKind },
      });
    } else {
      expect(sourceBindingStep).toBeUndefined();
    }
  });

  it.each(surfaces)('$name resolves its embedded editor mode without a provider', async (spec) => {
    const flow = spec.modelClass.globalFlowRegistry.getFlow(spec.flowKey);
    const step = flow?.getStep('runJs');
    const codeSchema = getRunJsCodeSchema(spec);

    if (spec.minHeight) {
      expect(codeSchema['x-component-props']?.minHeight).toBe(spec.minHeight);
    } else {
      expect(codeSchema['x-component-props']?.height).toBe('100%');
    }
    expect(codeSchema['x-component-props']?.wrapperStyle).toBeUndefined();
    expect(codeSchema['x-component-props']?.containerStyle).toMatchObject({
      height: '100%',
      minHeight: 0,
      minWidth: 0,
    });
    const uiMode = (step?.serialize() as SerializedRunJSStep | undefined)?.uiMode;
    expect(uiMode).toBeTypeOf('function');
    const resolvedUiMode =
      typeof uiMode === 'function'
        ? await uiMode({
            model: {
              context: {
                t: (key) => key,
              },
              getStepParams: () => ({ sourceMode: 'inline' }),
            },
          })
        : uiMode;
    const props = resolvedUiMode?.props;
    expect(props?.footer).toBeUndefined();
  });

  it.each(surfaces)('$name routes source and runtime settings through $flowKey', async (spec) => {
    const bindingOnly = spec.name === 'JSColumnModel';
    const model = createSurfaceModel(
      spec,
      bindingOnly ? {} : { code: 'ctx.render("inline fallback");', version: 'v2' },
    );
    const sourceBinding = {
      type: 'light-extension-entry',
      repoId: 'repo_surface_contracts',
      entryId: `entry_${spec.name}`,
      kind: spec.lightExtensionKind,
    };
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({ code: '' }),
      getSettingsDescriptor: async () => ({
        entryId: sourceBinding.entryId,
        settingsSchemaHash: 'surface-schema-v1',
        defaults: { label: 'Default label' },
        schema: {
          type: 'object',
          properties: {
            label: { type: 'string', title: 'Label' },
          },
        },
      }),
    });
    const sourceModeStep = model.getFlow(spec.flowKey)?.steps.sourceMode;
    const settingsContext = model.context as FlowSettingsContext<FlowModel>;

    await sourceModeStep?.beforeParamsSave?.(
      settingsContext,
      { sourceMode: 'light-extension', sourceBinding, settings: {} },
      {},
    );

    const runJs = model.getStepParams(spec.flowKey, 'runJs') as Record<string, unknown>;
    expect(runJs).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding,
      settings: {},
    });
    const defaultParams = sourceModeStep?.defaultParams;
    expect(defaultParams).toBeTypeOf('function');
    const resolvedDefaultParams =
      typeof defaultParams === 'function' ? await defaultParams(settingsContext) : defaultParams;
    expect(resolvedDefaultParams).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding,
      settings: {},
    });
    const otherFlowKey = spec.flowKey === 'jsSettings' ? 'clickSettings' : 'jsSettings';
    expect(model.getStepParams(otherFlowKey, 'runJs')).toBeUndefined();
    if (bindingOnly) {
      expect(runJs).not.toHaveProperty('code');
    } else {
      expect(runJs).toMatchObject({ code: 'ctx.render("inline fallback");', version: 'v2' });
    }

    const runtimeSteps = await model.getRuntimeFlowSettingSteps(spec.flowKey);
    const labelStep = getStepByTitle(runtimeSteps, 'Label');
    expect(labelStep?.uiSchema?.value?.['x-component']).toBe(spec.settingsComponent);
    expect(labelStep?.persistParams).toBe(false);
    expect(
      typeof labelStep?.defaultParams === 'function'
        ? labelStep.defaultParams(settingsContext)
        : labelStep?.defaultParams,
    ).toEqual({ value: 'Default label' });
    labelStep?.beforeParamsSave?.(settingsContext, { value: 'Saved label' });
    expect(model.getStepParams(spec.flowKey, 'runJs')).toMatchObject({
      settings: { label: 'Saved label' },
    });
  });

  it('runs the complete light extension settings host contract once', async () => {
    const spec = surfaces.find((surface) => surface.name === 'JSBlockModel') as SurfaceSpec;
    const model = createSurfaceModel(spec);
    const sourceBinding = {
      type: 'light-extension-entry',
      repoId: 'repo_settings_contract',
      entryId: 'entry_settings_contract',
      kind: 'js-block',
    };

    await assertLightExtensionSettingsHostContract({
      model,
      flowKey: spec.flowKey,
      settingsComponent: spec.settingsComponent,
      sourceBinding,
      nextSourceBinding: {
        ...sourceBinding,
        entryId: 'entry_settings_contract_next',
      },
    });
  });

  it('runs the shared JS Item source/settings contract once', async () => {
    const spec = surfaces.find((surface) => surface.name === 'JSItemModel') as SurfaceSpec;
    const model = createSurfaceModel(spec);

    await assertJSItemLightExtensionSourceContract({
      model,
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'repo_item_contract',
        entryId: 'entry_item_contract',
        kind: 'js-item',
      },
      settings: { color: 'red' },
      settingsComponent: spec.settingsComponent,
      settingKey: 'color',
      settingTitle: 'Color',
      updatedValue: 'blue',
    });
  });
});
