/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  isRunJSValue,
  normalizeRunJSValue,
  useFlowContext,
  useFlowStep,
  type FlowModel,
  type FlowRuntimeContext,
  type RunJSValue,
} from '@nocobase/flow-engine';

import { CodeEditor } from '../code-editor';
import { RunJSEditorRegistry } from './RunJSEditorRegistry';
import type { RunJSEditorFieldProps, RunJSEditorProviderRenderProps, RunJSSourceLocator } from './types';

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type StepParams = Record<string, unknown>;
type RunJSSettingsContext = FlowRuntimeContext<FlowModel, 'runtime' | 'settings'>;
type RunJSEditorValueMode = 'code' | 'runjsValue';

function isRecord(value: unknown): value is StepParams {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneRecord(value: unknown): StepParams {
  return isRecord(value) ? { ...value } : {};
}

function resolveVersionPath(paramPath: string[], versionPath?: string[]): string[] {
  if (versionPath?.length) {
    return versionPath;
  }
  if (paramPath.length > 1) {
    return [...paramPath.slice(0, -1), 'version'];
  }
  return ['version'];
}

function getAtPath(root: unknown, path: string[]): unknown {
  let current = root;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function resolveFallbackVersion(params: unknown, versionPath: string[]): string {
  const version = getAtPath(params, versionPath);
  return typeof version === 'string' && version ? version : 'v2';
}

function normalizeEditorValue(value: unknown, fallbackVersion: string): RunJSValue {
  if (isRunJSValue(value)) {
    return normalizeRunJSValue(value);
  }
  if (typeof value === 'string') {
    return { code: value, version: fallbackVersion };
  }
  return { code: '', version: fallbackVersion };
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

function setAtPath(root: StepParams, path: string[], value: unknown) {
  if (!path.length) {
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
  return {
    kind: 'flowModel.step',
    modelUid,
    flowKey,
    stepKey,
    paramPath,
    versionPath: resolveVersionPath(paramPath, props.versionPath),
  };
}

function syncFlowModelStepValue(
  model: FlowModel | undefined,
  locator: FlowModelStepLocator | undefined,
  value: RunJSValue,
  surfaceStyle: RunJSEditorFieldProps['surfaceStyle'],
) {
  if (!model || !locator) {
    return;
  }

  const currentStepParams = cloneRecord(model.getStepParams(locator.flowKey, locator.stepKey));
  setAtPath(currentStepParams, locator.paramPath, value.code);
  setAtPath(currentStepParams, resolveVersionPath(locator.paramPath, locator.versionPath), value.version);
  model.setStepParams(locator.flowKey, locator.stepKey, currentStepParams);
  model.invalidateFlowCache('beforeRender', true);
  if (surfaceStyle === 'render') {
    model.rerender().catch((error) => {
      console.error('RunJSEditorField: failed to refresh published RunJS surface', error);
    });
  }
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
  const current = normalizeEditorValue(value, resolveFallbackVersion(flowStep?.params, fieldVersionPath));
  const generatedLocator = createFlowModelStepLocator(props, flowContext, flowStep?.path);
  const locator = props.sourceLocator ?? props.locator ?? generatedLocator;
  const label = props.sourceLabel ?? props.label;
  const handleProviderChange = (nextValue: RunJSValue) => {
    onChange?.(toFieldChangeValue(valueMode, nextValue));
    syncFlowModelStepValue(flowContext?.model, generatedLocator, nextValue, props.surfaceStyle);
  };
  const providerProps: RunJSEditorProviderRenderProps = {
    ...props,
    value: current,
    onChange: handleProviderChange,
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
  const provider = RunJSEditorRegistry.getProvider(providerProps);

  if (provider) {
    return <>{provider.renderEditor(providerProps)}</>;
  }

  const tip = t?.('Use return to output value') ?? 'Use return to output value';
  const placeholderText = `// ${tip}`;

  return (
    <div style={containerStyle}>
      <CodeEditor
        value={current.code}
        onChange={(code) => onChange?.(toFieldChangeValue(valueMode, { ...current, code }))}
        version={current.version}
        height={height}
        minHeight={minHeight}
        theme={theme}
        enableLinter={enableLinter}
        wrapperStyle={wrapperStyle}
        placeholder={placeholderText}
        scene={scene}
        readonly={readOnly || disabled}
      />
    </div>
  );
};
