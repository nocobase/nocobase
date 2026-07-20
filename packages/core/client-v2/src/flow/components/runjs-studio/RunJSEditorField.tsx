/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { isEqual } from 'lodash';
import {
  isRunJSValue,
  normalizeRunJSValue,
  useFlowContext,
  useFlowStep,
  FlowModel,
  type FlowRuntimeContext,
  type ParamObject,
  type RunJSValue,
} from '@nocobase/flow-engine';

import { CodeEditor } from '../code-editor';
import { RunJSEditorRegistry } from './RunJSEditorRegistry';
import type { RunJSEditorFieldProps, RunJSEditorProviderRenderProps, RunJSSourceLocator } from './types';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type StepParams = ParamObject;
type RunJSSettingsContext = FlowRuntimeContext<FlowModel, 'runtime' | 'settings'> & {
  getStepFormValues?: (flowKey: string, stepKey: string) => unknown;
};
type RunJSEditorValueMode = 'code' | 'runjsValue';
type SavedRunJSValue = RunJSValue & {
  sourceRef?: unknown;
};

const UNSAFE_RUNJS_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const SOURCE_BINDING_IDENTITY_KEYS = ['type', 'repoId', 'entryId', 'kind'] as const;

function isRecord(value: unknown): value is StepParams {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneRecord(value: unknown): StepParams {
  if (!isRecord(value)) {
    return {};
  }
  const clone: StepParams = {};
  for (const [key, item] of Object.entries(value)) {
    clone[key] = item;
  }
  return clone;
}

function resolveVersionPath(paramPath: readonly string[], versionPath?: readonly string[]): string[] {
  if (versionPath?.length) {
    return [...versionPath];
  }
  if (paramPath.length > 1) {
    return [...paramPath.slice(0, -1), 'version'];
  }
  return ['version'];
}

function resolveSourceRefPath(paramPath: readonly string[]): string[] {
  if (paramPath.length > 1) {
    return [...paramPath.slice(0, -1), 'sourceRef'];
  }
  return ['sourceRef'];
}

function getAtPath(root: unknown, path: readonly string[]): unknown {
  let current = root;
  for (const key of path) {
    if (
      !isRecord(current) ||
      UNSAFE_RUNJS_PATH_SEGMENTS.has(key) ||
      !Object.prototype.hasOwnProperty.call(current, key)
    ) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function resolveFallbackVersion(params: unknown, versionPath: readonly string[], value: unknown): string {
  const version = getAtPath(params, versionPath);
  if (typeof version === 'string' && version) {
    return version;
  }
  const code = typeof value === 'string' ? value : isRunJSValue(value) ? value.code : '';
  return code.trim() ? 'v1' : 'v2';
}

function normalizeEditorValue(value: unknown, fallbackVersion: string): RunJSValue {
  if (isRunJSValue(value)) {
    const normalized = normalizeRunJSValue(value);
    return typeof value.version === 'string' && value.version
      ? normalized
      : { ...normalized, version: fallbackVersion };
  }
  if (typeof value === 'string') {
    return { code: value, version: fallbackVersion };
  }
  return { code: '', version: fallbackVersion };
}

function mergeRunJSValueWithStepParams(
  value: RunJSValue,
  stepParams: unknown,
  paramPath: readonly string[],
): SavedRunJSValue {
  if (!isRecord(stepParams)) {
    return value;
  }

  const sourceConfigPath = paramPath.slice(0, -1);
  const sourceConfig = sourceConfigPath.length ? getAtPath(stepParams, sourceConfigPath) : stepParams;
  if (!isRecord(sourceConfig)) {
    return value;
  }
  const sourceMode = typeof sourceConfig.sourceMode === 'string' ? sourceConfig.sourceMode : undefined;
  const sourceRef = getAtPath(stepParams, resolveSourceRefPath(paramPath));

  return {
    ...value,
    ...(sourceMode ? { sourceMode } : {}),
    ...(isRecord(sourceConfig.sourceBinding) ? { sourceBinding: cloneRecord(sourceConfig.sourceBinding) } : {}),
    ...(isRecord(sourceConfig.settings) ? { settings: cloneRecord(sourceConfig.settings) } : {}),
    ...(isRecord(sourceRef) ? { sourceRef: cloneRecord(sourceRef) } : {}),
  };
}

function resolveValueMode(value: unknown, props: RunJSEditorFieldProps): RunJSEditorValueMode {
  if (typeof value === 'string') {
    return 'code';
  }
  if (props.locatorFactory === 'flowModel.step' && !isRunJSValue(value)) {
    return 'code';
  }
  return 'runjsValue';
}

function toFieldChangeValue(valueMode: RunJSEditorValueMode, value: RunJSValue): RunJSValue | string {
  return valueMode === 'code' ? value.code : value;
}

function setAtPath(root: StepParams, path: readonly string[], value: unknown) {
  if (!path.length || path.some((segment) => UNSAFE_RUNJS_PATH_SEGMENTS.has(segment))) {
    return;
  }

  let target = root;
  for (const key of path.slice(0, -1)) {
    const next = cloneRecord(target[key]);
    target[key] = next;
    target = next;
  }
  target[path[path.length - 1]] = value;
}

function hasSameSourceBinding(candidate: unknown, sourceBinding: RunJSValue['sourceBinding']): boolean {
  if (!isRecord(candidate) || !isRecord(sourceBinding)) {
    return false;
  }

  const identityKeys = SOURCE_BINDING_IDENTITY_KEYS.filter((key) => typeof sourceBinding[key] !== 'undefined');
  if (identityKeys.length >= 2) {
    return identityKeys.every((key) => isEqual(candidate[key], sourceBinding[key]));
  }

  return isEqual(candidate, sourceBinding);
}

function containsSourceBinding(
  value: unknown,
  sourceBinding: RunJSValue['sourceBinding'],
  visited = new Set<object>(),
): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (visited.has(value)) {
    return false;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => containsSourceBinding(item, sourceBinding, visited));
  }

  const record = value as Record<string, unknown>;
  if (hasSameSourceBinding(record.sourceBinding, sourceBinding)) {
    return true;
  }

  return Object.values(record).some((item) => containsSourceBinding(item, sourceBinding, visited));
}

function collectModelTree(model: FlowModel, models: Set<FlowModel>): void {
  if (models.has(model)) {
    return;
  }
  models.add(model);

  Object.values(model.subModels).forEach((subModel) => {
    if (Array.isArray(subModel)) {
      subModel.forEach((item) => collectModelTree(item, models));
      return;
    }
    if (subModel instanceof FlowModel) {
      collectModelTree(subModel, models);
    }
  });
}

function collectLoadedModels(model: FlowModel): Set<FlowModel> {
  const models = new Set<FlowModel>();
  let root = model;
  while (root.parent) {
    root = root.parent;
  }
  collectModelTree(root, models);
  model.flowEngine?.forEachModel((loadedModel) => collectModelTree(loadedModel, models));
  return models;
}

async function refreshLoadedRunJSSourceHosts(
  model: FlowModel,
  sourceBinding: RunJSValue['sourceBinding'],
): Promise<void> {
  if (!isRecord(sourceBinding)) {
    await model.rerender();
    return;
  }

  const sourceHosts = Array.from(collectLoadedModels(model)).filter((loadedModel) =>
    containsSourceBinding(loadedModel.getStepParams(), sourceBinding),
  );
  const targets = sourceHosts.length > 0 ? sourceHosts : [model];
  targets.forEach((target) => target.invalidateFlowCache('beforeRender', true));
  await Promise.all(targets.map((target) => target.rerender()));
}

function resolveStepKey(path: string | undefined, modelUid: string, flowKey: string): string | undefined {
  const prefix = `${modelUid}_${flowKey}_`;
  return path?.startsWith(prefix) ? path.slice(prefix.length) || undefined : undefined;
}

function createFlowModelStepLocator(
  props: RunJSEditorFieldProps,
  flowContext: RunJSSettingsContext | null,
  stepPath: string | undefined,
): FlowModelStepLocator | undefined {
  if (props.locatorFactory !== 'flowModel.step') {
    return undefined;
  }

  const modelUid = flowContext?.model?.uid;
  const flowKey = props.flowKey || flowContext?.flowKey;
  if (!modelUid || !flowKey) {
    return undefined;
  }

  const stepKey = props.stepKey || resolveStepKey(stepPath, modelUid, flowKey);
  if (!stepKey) {
    return undefined;
  }

  const paramPath = props.paramPath?.length ? props.paramPath : ['code'];
  const versionPath = resolveVersionPath(paramPath, props.versionPath);
  if (
    UNSAFE_RUNJS_PATH_SEGMENTS.has(flowKey) ||
    UNSAFE_RUNJS_PATH_SEGMENTS.has(stepKey) ||
    paramPath.some((segment) => UNSAFE_RUNJS_PATH_SEGMENTS.has(segment)) ||
    versionPath.some((segment) => UNSAFE_RUNJS_PATH_SEGMENTS.has(segment))
  ) {
    return undefined;
  }
  return {
    kind: 'flowModel.step',
    modelUid,
    flowKey,
    stepKey,
    paramPath,
    versionPath,
  };
}

function syncFlowModelStepValue(
  model: FlowModel | undefined,
  locator: FlowModelStepLocator | undefined,
  value: SavedRunJSValue,
  surfaceStyle: RunJSEditorFieldProps['surfaceStyle'],
  stepParams: unknown,
  persist: boolean,
): Promise<void> {
  if (!model || !locator) {
    return Promise.resolve();
  }

  const savedStepParams = cloneRecord(model.getStepParams(locator.flowKey, locator.stepKey));
  const currentStepParams: StepParams = {};
  Object.assign(currentStepParams, savedStepParams, cloneRecord(stepParams));
  setAtPath(currentStepParams, locator.paramPath, value.code);
  setAtPath(currentStepParams, resolveVersionPath(locator.paramPath, locator.versionPath), value.version);
  const sourceConfigPath = locator.paramPath.slice(0, -1);
  if (value.sourceMode !== undefined) {
    setAtPath(currentStepParams, [...sourceConfigPath, 'sourceMode'], value.sourceMode);
  }
  if (Object.prototype.hasOwnProperty.call(value, 'sourceBinding')) {
    setAtPath(currentStepParams, [...sourceConfigPath, 'sourceBinding'], value.sourceBinding);
  }
  if (Object.prototype.hasOwnProperty.call(value, 'settings')) {
    setAtPath(currentStepParams, [...sourceConfigPath, 'settings'], value.settings);
  }
  if (value.sourceRef !== undefined) {
    setAtPath(currentStepParams, resolveSourceRefPath(locator.paramPath), value.sourceRef);
  }
  const stepParamsChanged = !isEqual(savedStepParams, currentStepParams);
  model.setStepParams(locator.flowKey, locator.stepKey, currentStepParams);
  if (!persist) {
    if (model.flowEngine) {
      model.flowEngine.forEachModel((targetModel) => {
        if (stepParamsChanged && targetModel === model) {
          return;
        }
        targetModel.emitter.emit('onStepParamsChanged');
      });
    } else if (!stepParamsChanged) {
      model.emitter.emit('onStepParamsChanged');
    }
  }
  model.invalidateFlowCache('beforeRender', true);

  const saveAndRefresh = async () => {
    if (persist) {
      await model.saveStepParams();
    }
    if (!persist && value.sourceMode && value.sourceBinding) {
      await refreshLoadedRunJSSourceHosts(model, value.sourceBinding);
      return;
    }
    if (surfaceStyle === 'render') {
      await model.rerender();
    }
  };

  return saveAndRefresh().catch((error) => {
    if (surfaceStyle === 'render') {
      console.error('RunJSEditorField: failed to refresh saved RunJS surface', error);
      return;
    }
    console.error('RunJSEditorField: failed to persist saved RunJS source', error);
  });
}

function resolveCurrentStepParams(
  flowContext: RunJSSettingsContext | null,
  locator: FlowModelStepLocator | undefined,
  fallbackParams: unknown,
): unknown {
  if (!flowContext || !locator || typeof flowContext.getStepFormValues !== 'function') {
    return fallbackParams;
  }

  return flowContext.getStepFormValues(locator.flowKey, locator.stepKey) ?? fallbackParams;
}

export const RunJSEditorField: React.FC<RunJSEditorFieldProps> = (props) => {
  const {
    t,
    value,
    onChange,
    height = '200px',
    minHeight,
    theme = 'light',
    enableLinter = true,
    wrapperStyle,
    scene = 'formValue',
    readOnly,
    disabled,
    containerStyle = { flex: 1, minWidth: 0 },
  } = props;
  const flowContext = useFlowContext<RunJSSettingsContext | null>();
  const flowStep = useFlowStep();
  const fieldParamPath = props.paramPath?.length ? props.paramPath : ['code'];
  const fieldVersionPath = resolveVersionPath(fieldParamPath, props.versionPath);
  const valueMode = resolveValueMode(value, props);
  const generatedLocator = createFlowModelStepLocator(props, flowContext, flowStep?.path);
  const current = mergeRunJSValueWithStepParams(
    normalizeEditorValue(value, resolveFallbackVersion(flowStep?.params, fieldVersionPath, value)),
    resolveCurrentStepParams(flowContext, generatedLocator, flowStep?.params),
    fieldParamPath,
  );
  const locator = props.sourceLocator ?? props.locator ?? generatedLocator;
  const label = props.sourceLabel ?? props.label;
  const applyProviderChange = (nextValue: RunJSValue, persist: boolean): Promise<void> => {
    onChange?.(toFieldChangeValue(valueMode, nextValue));
    return syncFlowModelStepValue(
      flowContext?.model,
      generatedLocator,
      nextValue,
      props.surfaceStyle,
      resolveCurrentStepParams(flowContext, generatedLocator, flowStep?.params),
      persist,
    );
  };
  const handleProviderChange = (nextValue: RunJSValue) => {
    applyProviderChange(nextValue, true);
  };
  const handleProviderPersistedChange = async (nextValue: RunJSValue) => {
    await applyProviderChange(nextValue, false);
  };
  const providerProps: RunJSEditorProviderRenderProps = {
    ...props,
    value: current,
    onChange: handleProviderChange,
    onPersistedChange: handleProviderPersistedChange,
    locator,
    label,
    height,
    minHeight,
    theme,
    enableLinter,
    wrapperStyle,
    scene,
    readOnly,
    disabled,
    containerStyle,
  };
  const providers = RunJSEditorRegistry.getProviders();
  const renderInlineEditor = (currentProps: RunJSEditorProviderRenderProps) => {
    const tip = currentProps.t?.('Use return to output value') ?? 'Use return to output value';
    return (
      <div style={currentProps.containerStyle}>
        <CodeEditor
          value={currentProps.value.code}
          onChange={(code) => currentProps.onChange?.({ ...currentProps.value, code })}
          version={currentProps.value.version}
          height={currentProps.height}
          minHeight={currentProps.minHeight}
          theme={currentProps.theme}
          enableLinter={currentProps.enableLinter}
          wrapperStyle={currentProps.wrapperStyle}
          placeholder={`// ${tip}`}
          scene={currentProps.scene}
          readonly={currentProps.readOnly || currentProps.disabled}
        />
      </div>
    );
  };
  const renderProvider = (index: number, currentProps: RunJSEditorProviderRenderProps): React.ReactNode => {
    let providerIndex = index;
    let provider = providers[providerIndex];
    while (provider && !(provider.canHandle?.(currentProps) ?? true)) {
      providerIndex += 1;
      provider = providers[providerIndex];
    }
    if (!provider) {
      return renderInlineEditor(currentProps);
    }
    return provider.renderEditor({
      ...currentProps,
      renderNext: (overrides = {}) =>
        renderProvider(providerIndex + 1, {
          ...currentProps,
          ...overrides,
          renderNext: undefined,
        }),
    });
  };

  if (!providers.some((provider) => provider.canHandle?.(providerProps) ?? true)) {
    return (
      <>
        {renderInlineEditor({
          ...providerProps,
          onChange: (nextValue) =>
            onChange?.(typeof nextValue === 'string' ? nextValue : toFieldChangeValue(valueMode, nextValue)),
        })}
      </>
    );
  }

  return <>{renderProvider(0, providerProps)}</>;
};
