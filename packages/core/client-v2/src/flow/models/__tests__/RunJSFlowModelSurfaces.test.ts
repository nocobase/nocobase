/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowEngine,
  FlowEngineProvider,
  FlowExitAllException,
  FlowModel,
  FlowModelRenderer,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@nocobase/test/client';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { App, ConfigProvider } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveDynamicFlowRunJSVersion, runjs as dynamicFlowRunJS } from '../../actions/runjs';
import { RunJSSourceResolverRegistry } from '../../components/runjs-source';
import { RunJSEditorField, RunJSEditorRegistry, type RunJSSurfaceStyle } from '../../components/runjs-studio';
import { JSActionModel } from '../actions/JSActionModel';
import {
  JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
} from '../actions/JSActionSourceModeField';
import { JSCollectionActionModel } from '../actions/JSCollectionActionModel';
import { JSItemActionModel } from '../actions/JSItemActionModel';
import { JSRecordActionModel } from '../actions/JSRecordActionModel';
import { FilterFormJSActionModel } from '../blocks/filter-form/FilterFormJSActionModel';
import { JSFormActionModel } from '../blocks/form/JSFormActionModel';
import { JSBlockModel } from '../blocks/js-block/JSBlock';
import {
  JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_BLOCK_JS_TEMPLATE_SETTINGS_STEP_FIELD,
} from '../blocks/js-block/JSBlockSourceModeField';
import { JSColumnModel } from '../blocks/table/JSColumnModel';
import { JSEditableFieldModel } from '../fields/JSEditableFieldModel';
import {
  JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD,
} from '../fields/JSFieldSourceModeField';
import { JSFieldModel } from '../fields/JSFieldModel';
import { JSItemModel } from '../fields/JSItemModel';
import {
  JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ITEM_JS_TEMPLATE_SETTINGS_STEP_FIELD,
} from '../fields/JSItemSourceModeField';
import { assertJsTemplateSettingsHostContract } from '../utils/__tests__/jsTemplateSettingsHostContract';

type SurfaceSpec = {
  name: string;
  modelClass: typeof FlowModel;
  flowKey: string;
  jsTemplateKind: 'js-block' | 'js-action' | 'js-field' | 'js-item';
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
    jsTemplateKind: 'js-block',
    surfaceStyle: 'render',
    scene: 'block',
    settingsComponent: JS_BLOCK_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: false,
    minHeight: 'calc(100vh - 42px)',
  },
  {
    name: 'JSFieldModel',
    modelClass: JSFieldModel,
    flowKey: 'jsSettings',
    jsTemplateKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSEditableFieldModel',
    modelClass: JSEditableFieldModel,
    flowKey: 'jsSettings',
    jsTemplateKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'formValue',
    sourceComponent: JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSItemModel',
    modelClass: JSItemModel,
    flowKey: 'jsSettings',
    jsTemplateKind: 'js-item',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ITEM_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSColumnModel',
    modelClass: JSColumnModel,
    flowKey: 'jsSettings',
    jsTemplateKind: 'js-field',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSItemActionModel',
    modelClass: JSItemActionModel,
    flowKey: 'jsSettings',
    jsTemplateKind: 'js-item',
    surfaceStyle: 'render',
    scene: 'block',
    sourceComponent: JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ITEM_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSActionModel',
    modelClass: JSActionModel,
    flowKey: 'clickSettings',
    jsTemplateKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSRecordActionModel',
    modelClass: JSRecordActionModel,
    flowKey: 'clickSettings',
    jsTemplateKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSCollectionActionModel',
    modelClass: JSCollectionActionModel,
    flowKey: 'clickSettings',
    jsTemplateKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'JSFormActionModel',
    modelClass: JSFormActionModel,
    flowKey: 'clickSettings',
    jsTemplateKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
  {
    name: 'FilterFormJSActionModel',
    modelClass: FilterFormJSActionModel,
    flowKey: 'clickSettings',
    jsTemplateKind: 'js-action',
    surfaceStyle: 'action',
    scene: 'eventFlow',
    sourceComponent: JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
    settingsComponent: JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
    hasSourceBindingStep: true,
  },
];

const settingsHosts = surfaces.filter((surface) =>
  ['JSBlockModel', 'JSFieldModel', 'JSColumnModel', 'JSItemModel', 'JSActionModel'].includes(surface.name),
);

const actionContextCases = [
  {
    name: 'form values',
    modelClass: JSFormActionModel,
    use: 'JSFormActionModel',
    code: 'ctx.__testState.value = ctx.form.getFieldsValue().status;',
    setup: (model: FlowModel) =>
      model.context.defineProperty('form', { value: { getFieldsValue: () => ({ status: 'pending' }) } }),
    expected: 'pending',
  },
  {
    name: 'selected collection rows',
    modelClass: JSCollectionActionModel,
    use: 'JSCollectionActionModel',
    code: 'ctx.__testState.value = ctx.resource.getSelectedRows().length + ctx.selectedRecords.length;',
    setup: (model: FlowModel) => {
      const rows = [{ id: 1 }, { id: 2 }];
      model.context.defineProperty('resource', { value: { getSelectedRows: () => rows } });
      model.context.defineProperty('selectedRecords', { value: rows });
    },
    expected: 4,
  },
  {
    name: 'record identity',
    modelClass: JSRecordActionModel,
    use: 'JSRecordActionModel',
    code: 'ctx.__testState.value = ctx.record.name + ":" + ctx.filterByTk;',
    setup: (model: FlowModel) => {
      model.context.defineProperty('record', { value: { id: 7, name: 'Ada' } });
      model.context.defineProperty('filterByTk', { value: 7 });
    },
    expected: 'Ada:7',
  },
  {
    name: 'filter form values',
    modelClass: FilterFormJSActionModel,
    use: 'FilterFormJSActionModel',
    code: 'ctx.__testState.value = ctx.form.getFieldsValue().status;',
    setup: (model: FlowModel) =>
      model.context.defineProperty('form', { value: { getFieldsValue: () => ({ status: 'active' }) } }),
    expected: 'active',
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

function createRuntimeSurface(spec: SurfaceSpec, runJs: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ [spec.name]: spec.modelClass });
  const model = engine.createModel({
    use: spec.name,
    uid: `${spec.name}-runtime-contract-${Math.random()}`,
    stepParams: { [spec.flowKey]: { runJs } },
  });
  return { engine, model };
}

function getStepByTitle(steps: Record<string, StepDefinition> | undefined, title: string) {
  return Object.values(steps || {}).find((step) => step.title === title);
}

function renderSurface(engine: FlowEngine, model: FlowModel) {
  return renderNode(engine, React.createElement(FlowModelRenderer, { model }));
}

function renderNode(engine: FlowEngine, node: React.ReactNode) {
  return render(
    React.createElement(
      FlowEngineProvider,
      { engine },
      React.createElement(ConfigProvider, null, React.createElement(App, null, node)),
    ),
  );
}

function definePresentationContext(model: FlowModel, presentation: 'field' | 'item') {
  model.context.defineProperty('record', { value: { name: 'Ada', level: 'VIP' } });
  if (presentation === 'field') {
    model.setProps({ value: '5551000' });
    model.context.defineProperty('collectionField', { value: { name: 'phone' } });
  } else {
    model.context.defineProperty('item', { value: { index: 2, value: { level: 'VIP' } } });
  }
}

setupRunJSTestHosts();

describe('RunJS FlowModel surfaces', () => {
  beforeEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSourceResolverRegistry.clear();
  });

  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSourceResolverRegistry.clear();
  });

  it('keeps Dynamic Flow editor and runtime version resolution aligned', async () => {
    expect(resolveDynamicFlowRunJSVersion('return {{ ctx.user.id }};', undefined)).toBe('v1');
    expect(resolveDynamicFlowRunJSVersion('', undefined)).toBe('v2');
    expect(resolveDynamicFlowRunJSVersion('return 1;', 'v2')).toBe('v2');

    const execute = vi.fn();
    const ctx = { inputArgs: {}, runjs: execute };

    await dynamicFlowRunJS.handler(ctx as never, { code: 'return {{ ctx.user.id }};' });
    await dynamicFlowRunJS.handler(ctx as never, { code: '', version: 'v2' });

    expect(execute).toHaveBeenNthCalledWith(1, 'return {{ ctx.user.id }};', undefined, { version: 'v1' });
    expect(execute).toHaveBeenNthCalledWith(2, '', undefined, { version: 'v2' });
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
        jsTemplateKind: spec.jsTemplateKind,
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
      expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component-props']).toMatchObject({
        kind: spec.jsTemplateKind,
      });
    } else {
      expect(sourceModeStep?.uiMode).toMatchObject({ type: 'cascadeMenu', key: 'sourceMode' });
    }

    if (spec.hasSourceBindingStep) {
      expect(sourceBindingStep?.hideInSettings).toBe(true);
      expect(sourceBindingStep?.uiSchema?.sourceBinding).toMatchObject({
        'x-component': spec.sourceComponent,
        'x-component-props': { kind: spec.jsTemplateKind },
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
      type: 'js-template-entry',
      projectId: 'jtp_surface_contracts',
      templateId: `jtt_${spec.name}`,
      kind: spec.jsTemplateKind,
    };
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: '' }),
      getSettingsDescriptor: async () => ({
        entryId: sourceBinding.templateId,
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
      { sourceMode: 'js-template', sourceBinding, settings: {} },
      {},
    );

    const runJs = model.getStepParams(spec.flowKey, 'runJs') as Record<string, unknown>;
    expect(runJs).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding,
      settings: {},
    });
    const defaultParams = sourceModeStep?.defaultParams;
    expect(defaultParams).toBeTypeOf('function');
    const resolvedDefaultParams =
      typeof defaultParams === 'function' ? await defaultParams(settingsContext) : defaultParams;
    expect(resolvedDefaultParams).toMatchObject({
      sourceMode: 'js-template',
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

  it.each(settingsHosts)('$name runs the complete JS Template settings host contract', async (spec) => {
    const model = createSurfaceModel(spec);
    const sourceBinding = {
      type: 'js-template-entry',
      projectId: `jtp_settings_contract_${spec.jsTemplateKind}`,
      templateId: `jtt_settings_contract_${spec.jsTemplateKind}`,
      kind: spec.jsTemplateKind,
    };

    await assertJsTemplateSettingsHostContract({
      model,
      flowKey: spec.flowKey,
      settingsComponent: spec.settingsComponent,
      sourceBinding,
      nextSourceBinding: {
        ...sourceBinding,
        templateId: `jtt_settings_contract_${spec.jsTemplateKind}_next`,
      },
    });
  });

  it.each([
    {
      presentation: 'field' as const,
      name: 'JSFieldModel',
      errorTestId: 'js-field-runtime-error',
    },
    {
      presentation: 'item' as const,
      name: 'JSItemModel',
      errorTestId: 'js-item-runtime-error',
    },
  ])('$name compiles, resolves, renders, reloads, falls back inline, and exposes runtime errors', async (testCase) => {
    const spec = surfaces.find((surface) => surface.name === testCase.name) as SurfaceSpec;
    const sourceBinding = {
      type: 'js-template-entry',
      projectId: `jtp_${testCase.presentation}_runtime`,
      templateId: `jtt_${testCase.presentation}_runtime`,
      kind: spec.jsTemplateKind,
    };
    const runJs = {
      sourceMode: 'js-template',
      sourceBinding,
      settings: { label: 'persisted' },
      code: `ctx.render(<span data-testid="${testCase.presentation}-inline">inline:{ctx.record.name}</span>);`,
      version: 'v2',
    };
    const resolve = vi.fn(() => ({
      code: `ctx.render(<span data-testid="${testCase.presentation}-template">{ctx.settings.label}:{ctx.record.name}</span>);`,
      version: 'v2',
      settings: { label: 'resolved' },
    }));
    const getSettingsDescriptor = vi.fn(async () => {
      throw new Error('render must not fetch a settings descriptor');
    });
    RunJSSourceResolverRegistry.registerResolver({ sourceMode: 'js-template', resolve, getSettingsDescriptor });

    const first = createRuntimeSurface(spec, runJs);
    definePresentationContext(first.model, testCase.presentation);
    const firstView = renderSurface(first.engine, first.model);
    await waitFor(() => {
      expect(screen.getByTestId(`${testCase.presentation}-template`)).toHaveTextContent('resolved:Ada');
    });
    expect(screen.queryByTestId(`${testCase.presentation}-inline`)).toBeNull();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'js-template',
        sourceBinding,
        settings: { label: 'persisted' },
        context: expect.objectContaining({ modelUid: first.model.uid }),
      }),
    );
    expect(getSettingsDescriptor).not.toHaveBeenCalled();
    firstView.unmount();

    const reloaded = createRuntimeSurface(spec, {
      ...(first.model.getStepParams(spec.flowKey, 'runJs') as Record<string, unknown>),
    });
    definePresentationContext(reloaded.model, testCase.presentation);
    const reloadedView = renderSurface(reloaded.engine, reloaded.model);
    await waitFor(() => {
      expect(screen.getByTestId(`${testCase.presentation}-template`)).toHaveTextContent('resolved:Ada');
    });
    reloadedView.unmount();

    const inline = createRuntimeSurface(spec, { ...runJs, sourceMode: 'inline' });
    definePresentationContext(inline.model, testCase.presentation);
    const inlineView = renderSurface(inline.engine, inline.model);
    await waitFor(() => {
      expect(screen.getByTestId(`${testCase.presentation}-inline`)).toHaveTextContent('inline:Ada');
    });
    inlineView.unmount();

    RunJSSourceResolverRegistry.clear();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: 'throw new Error("adapter runtime failed");', version: 'v2' }),
    });
    const failing = createRuntimeSurface(spec, runJs);
    definePresentationContext(failing.model, testCase.presentation);
    renderSurface(failing.engine, failing.model);
    await waitFor(() => {
      expect(screen.getByTestId(testCase.errorTestId)).toHaveTextContent('adapter runtime failed');
    });
  });

  it('runs the JS Column adapter per cell through resolve, render, reload, and isolated runtime errors', async () => {
    const sourceBinding = {
      type: 'js-template-entry',
      projectId: 'jtp_column_runtime',
      templateId: 'jtt_column_runtime',
      kind: 'js-field',
    };
    const createColumn = () => {
      const engine = new FlowEngine();
      const collectionName = `contacts_${Math.random().toString(16).slice(2)}`;
      engine.registerModels({ JSColumnModel });
      const model = new JSColumnModel({
        uid: `js-column-runtime-${Math.random()}`,
        flowEngine: engine,
        props: { width: 200, title: 'Phone' },
        stepParams: {
          jsSettings: {
            runJs: {
              sourceMode: 'js-template',
              sourceBinding,
              settings: { prefix: 'persisted:' },
              code: 'ctx.render(<span data-testid={"column-inline-" + ctx.record.id}>{ctx.value}</span>);',
              version: 'v2',
            },
          },
        },
      } as never);
      engine.context.dataSourceManager.getDataSource('main').addCollection({
        name: collectionName,
        filterTargetKey: 'id',
        fields: [{ name: 'phone', type: 'string', interface: 'input' }],
      });
      model.context.defineProperty('collection', {
        value: engine.context.dataSourceManager.getCollection('main', collectionName),
      });
      model.context.defineProperty('collectionField', { value: { name: 'phone' } });
      return { engine, model };
    };
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({
        code: `ctx.render(<span data-testid={'column-' + ctx.record.id}>{ctx.settings.prefix}{ctx.record.name}:{ctx.value}</span>);`,
        version: 'v2',
        settings: { prefix: 'resolved:' },
      }),
    });

    const first = createColumn();
    const firstColumn = first.model.getColumnProps();
    const firstView = renderNode(
      first.engine,
      React.createElement(
        'div',
        null,
        firstColumn.render('5551000', { id: 1, name: 'Ada' }, 0),
        firstColumn.render('5552000', { id: 2, name: 'Grace' }, 1),
      ),
    );
    await waitFor(() => {
      expect(screen.getByTestId('column-1')).toHaveTextContent('resolved:Ada:5551000');
      expect(screen.getByTestId('column-2')).toHaveTextContent('resolved:Grace:5552000');
    });
    firstView.unmount();

    const reloaded = createColumn();
    const reloadedColumn = reloaded.model.getColumnProps();
    const reloadedView = renderNode(
      reloaded.engine,
      React.createElement('div', null, reloadedColumn.render('5551000', { id: 1, name: 'Ada' }, 0)),
    );
    await waitFor(() => {
      expect(screen.getByTestId('column-1')).toHaveTextContent('resolved:Ada:5551000');
    });
    reloadedView.unmount();

    RunJSSourceResolverRegistry.clear();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({
        code: `if (ctx.value === 'bad') throw new Error('bad cell'); ctx.render(<span data-testid={'column-ok-' + ctx.record.id}>{ctx.value}</span>);`,
        version: 'v2',
      }),
    });
    const failing = createColumn();
    const failingColumn = failing.model.getColumnProps();
    renderNode(
      failing.engine,
      React.createElement(
        'div',
        null,
        failingColumn.render('bad', { id: 1, name: 'Ada' }, 0),
        failingColumn.render('5552000', { id: 2, name: 'Grace' }, 1),
      ),
    );
    await waitFor(() => {
      expect(screen.getByTestId('js-column-runtime-error')).toHaveTextContent('bad cell');
      expect(screen.getByTestId('column-ok-2')).toHaveTextContent('5552000');
    });
  });

  it('runs the JS Action adapter through resolve, execute, reload, inline fallback, and visible errors', async () => {
    const sourceBinding = {
      type: 'js-template-entry',
      projectId: 'jtp_action_runtime',
      templateId: 'jtt_action_runtime',
      kind: 'js-action',
    };
    const runJs = {
      sourceMode: 'js-template',
      sourceBinding,
      settings: { label: 'persisted' },
      code: 'ctx.message.info("inline action");',
      version: 'v2',
    };
    const createAction = (params: Record<string, unknown>) => {
      const engine = new FlowEngine();
      engine.registerModels({ JSActionModel });
      const model = engine.createModel<JSActionModel>({
        use: 'JSActionModel',
        uid: `js-action-runtime-${Math.random()}`,
        props: { loading: false },
        stepParams: { clickSettings: { runJs: params } },
      });
      const state: Record<string, unknown> = {};
      const message = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
      model.context.defineProperty('__testState', { value: state });
      model.context.defineProperty('message', { value: message });
      return { model, state, message };
    };
    const resolve = vi.fn(() => ({
      code: 'ctx.__testState.result = ctx.settings.label; ctx.message.success(ctx.settings.label);',
      version: 'v2',
      settings: { label: 'resolved' },
    }));
    RunJSSourceResolverRegistry.registerResolver({ sourceMode: 'js-template', resolve });

    const first = createAction(runJs);
    await first.model.applyFlow('clickSettings');
    expect(first.state.result).toBe('resolved');
    expect(first.message.success).toHaveBeenCalledWith('resolved');
    expect(first.model.props.loading).toBe(false);

    const reloaded = createAction({
      ...(first.model.getStepParams('clickSettings', 'runJs') as Record<string, unknown>),
    });
    await reloaded.model.applyFlow('clickSettings');
    expect(reloaded.state.result).toBe('resolved');

    const inline = createAction({ ...runJs, sourceMode: 'inline' });
    await inline.model.applyFlow('clickSettings');
    expect(inline.message.info).toHaveBeenCalledWith('inline action');

    RunJSSourceResolverRegistry.clear();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => {
        throw new Error('action entry missing');
      },
    });
    const failing = createAction(runJs);
    await expect(failing.model.applyFlow('clickSettings')).resolves.toBeTruthy();
    expect(failing.message.error).toHaveBeenCalledWith('action entry missing');
  });

  it.each(actionContextCases)('keeps $name available to the $use JS Action adapter', async (testCase) => {
    const engine = new FlowEngine();
    engine.registerModels({ [testCase.use]: testCase.modelClass });
    const model = engine.createModel({
      use: testCase.use,
      uid: `${testCase.use}-context-contract`,
      props: { loading: false },
      stepParams: {
        clickSettings: {
          runJs: {
            sourceMode: 'js-template',
            sourceBinding: {
              type: 'js-template-entry',
              projectId: 'jtp_action_context',
              templateId: `jtt_${testCase.use}`,
              kind: 'js-action',
            },
            settings: {},
            code: 'ctx.__testState.value = "inline";',
            version: 'v2',
          },
        },
      },
    });
    const state: Record<string, unknown> = {};
    model.context.defineProperty('__testState', { value: state });
    model.context.defineProperty('message', {
      value: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    });
    testCase.setup(model);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: testCase.code, version: 'v2' }),
    });

    await model.applyFlow('clickSettings');

    expect(state.value).toEqual(testCase.expected);
    expect(model.props.loading).toBe(false);
  });

  it('keeps ctx.exit() on the JS Action FlowExecutor normal-exit path', async () => {
    const spec = surfaces.find((surface) => surface.name === 'JSActionModel') as SurfaceSpec;
    const { model } = createRuntimeSurface(spec, {
      sourceMode: 'inline',
      code: 'ctx.exit();',
      version: 'v2',
    });
    const error = vi.fn();
    model.context.defineProperty('message', {
      value: { success: vi.fn(), error, info: vi.fn(), warning: vi.fn() },
    });

    await expect(model.applyFlow('clickSettings')).resolves.toBeInstanceOf(FlowExitAllException);
    expect(error).not.toHaveBeenCalled();
  });
});
