/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, type Form } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import {
  ApplicationContext,
  CodeEditor,
  type RunJSEditorProvider,
  type RunJSEditorProviderRenderProps,
  type RunJSSourceLocator,
} from '@nocobase/client-v2';
import {
  useFlowContext,
  type FlowEngineContext,
  type FlowModel,
  type ParamObject,
  type RunJSValue,
} from '@nocobase/flow-engine';
import { Alert, Button, Flex, Space } from 'antd';
import React from 'react';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import type {
  LightExtensionEntryRuntimeArtifact,
  LightExtensionKind,
  LightExtensionRuntimeSourceBinding,
} from '../../shared/types';
import {
  getLightExtensionEntry,
  moveLightExtensionToInline,
  type ApiClientLike,
} from '../api/lightExtensionEntriesRequests';
import { isLightExtensionRuntimeSourceBinding } from '../resolvers/LightExtensionRunJSResolver';
import LightExtensionWorkspacePage, {
  type LightExtensionMoveToInlineRequest,
  type LightExtensionWorkspaceFooterActions,
} from '../pages/LightExtensionWorkspacePage';
import type { LightExtensionWorkspaceScope } from '../workspace/lightExtensionWorkspaceAccess';
import { RunJSLightExtensionSourceField } from './JSBlockLightExtensionSourceField';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

type RunJSValueFormValues = {
  code?: string;
  version?: string;
  sourceMode?: string;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  settings?: Record<string, unknown>;
};

type LightExtensionEditorView = {
  close?: () => boolean | void | Promise<boolean | void>;
  destroy?: () => void;
  setFooter?: (footer: React.ReactNode) => void;
};

type LightExtensionEditorFlowContext = FlowEngineContext & {
  api?: ApiClientLike;
  model?: FlowModel;
};

type ApplicationWithApi = {
  apiClient?: ApiClientLike;
};

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;
type LightExtensionEntryWorkspaceScope = Extract<LightExtensionWorkspaceScope, { mode: 'entry' }>;

const UNSAFE_RUNJS_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

const SchemaField = createSchemaField({
  components: {
    RunJSLightExtensionSourceField,
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonRecord<T extends Record<string, unknown>>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeSourceMode(value: unknown): string {
  return value === LIGHT_EXTENSION_SOURCE_MODE ? LIGHT_EXTENSION_SOURCE_MODE : INLINE_SOURCE_MODE;
}

function normalizeFormValues(value: RunJSValue): RunJSValueFormValues {
  const sourceMode = normalizeSourceMode(value.sourceMode);
  return {
    code: String(value.code ?? ''),
    version: String(value.version ?? 'v2'),
    sourceMode,
    sourceBinding: isLightExtensionRuntimeSourceBinding(value.sourceBinding) ? { ...value.sourceBinding } : undefined,
    settings: isRecord(value.settings) ? cloneJsonRecord(value.settings) : {},
  };
}

function toRunJSValue(values: RunJSValueFormValues): RunJSValue {
  const code = String(values.code ?? '');
  const version = String(values.version ?? 'v2');
  const sourceMode = normalizeSourceMode(values.sourceMode);
  if (sourceMode !== LIGHT_EXTENSION_SOURCE_MODE) {
    return {
      code,
      version,
      sourceMode: INLINE_SOURCE_MODE,
    };
  }

  return {
    code,
    version,
    sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
    ...(isLightExtensionRuntimeSourceBinding(values.sourceBinding)
      ? { sourceBinding: { ...values.sourceBinding } }
      : {}),
    settings: isRecord(values.settings) ? cloneJsonRecord(values.settings) : {},
  };
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function setFormValues(form: Form, values: RunJSValueFormValues) {
  form.setValuesIn('code', values.code);
  form.setValuesIn('version', values.version);
  form.setValuesIn('sourceMode', values.sourceMode);
  form.setValuesIn('sourceBinding', values.sourceBinding);
  form.setValuesIn('settings', values.settings);
}

const RunJSLightExtensionEditor: React.FC<RunJSEditorProviderRenderProps> = (props) => {
  const { onPreview } = props;
  const initialValuesRef = React.useRef(normalizeFormValues(props.value));
  const form = React.useMemo(() => createForm({ initialValues: initialValuesRef.current }), []);
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  const applyingExternalValueRef = React.useRef(false);
  const lastValueSignatureRef = React.useRef(stableSerialize(normalizeFormValues(props.value)));
  const readonly = props.readOnly || props.disabled;

  React.useEffect(() => {
    const nextValues = normalizeFormValues(props.value);
    const nextSignature = stableSerialize(nextValues);
    if (nextSignature === lastValueSignatureRef.current) {
      return;
    }
    const currentSignature = stableSerialize(normalizeFormValues(toRunJSValue(form.values as RunJSValueFormValues)));
    lastValueSignatureRef.current = nextSignature;
    if (currentSignature === nextSignature) {
      return;
    }

    applyingExternalValueRef.current = true;
    setFormValues(form, nextValues);
    applyingExternalValueRef.current = false;
    rerender();
  }, [form, props.value]);

  const onChange = props.onChange;

  React.useEffect(() => {
    const subscriptionId = form.subscribe(() => {
      if (applyingExternalValueRef.current) {
        return;
      }
      rerender();
      const nextValue = toRunJSValue(form.values as RunJSValueFormValues);
      lastValueSignatureRef.current = stableSerialize(normalizeFormValues(nextValue));
      onChange?.(nextValue);
    });
    return () => {
      form.unsubscribe(subscriptionId);
    };
  }, [form, onChange]);

  const formValues = form.values as RunJSValueFormValues;
  const sourceMode = normalizeSourceMode(formValues.sourceMode);
  const tip = props.t?.('Use return to output value') ?? 'Use return to output value';
  const handleInlineEditorChange = React.useCallback(
    (nextValue: RunJSValue | string) => {
      const code = typeof nextValue === 'string' ? nextValue : nextValue.code;
      const version = typeof nextValue === 'string' ? String(formValues.version ?? 'v2') : nextValue.version;
      form.setValuesIn('code', code);
      form.setValuesIn('version', version || 'v2');
    },
    [form, formValues.version],
  );
  const handleLightExtensionPreview = React.useCallback(
    async (artifact: LightExtensionEntryRuntimeArtifact) => {
      if (!onPreview) {
        return;
      }
      await onPreview({
        ...toRunJSValue(form.values as RunJSValueFormValues),
        code: artifact.code,
        version: artifact.version,
        sourceMode: INLINE_SOURCE_MODE,
      });
    },
    [form, onPreview],
  );

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', minWidth: 0 }}>
      <FormProvider form={form}>
        <SchemaField
          schema={{
            type: 'object',
            properties: {
              [sourceMode === LIGHT_EXTENSION_SOURCE_MODE ? 'sourceBinding' : 'sourceMode']: {
                type: sourceMode === LIGHT_EXTENSION_SOURCE_MODE ? 'object' : 'string',
                'x-component': 'RunJSLightExtensionSourceField',
                'x-component-props': {
                  disabled: readonly,
                  showEntryWorkspace: sourceMode === LIGHT_EXTENSION_SOURCE_MODE,
                  onEmbeddedEditorControllerChange: props.onEmbeddedEditorControllerChange,
                  onPreview: onPreview ? handleLightExtensionPreview : undefined,
                },
              },
            },
          }}
        />
      </FormProvider>
      {sourceMode === INLINE_SOURCE_MODE
        ? props.renderNext?.({
            value: toRunJSValue(formValues),
            onChange: handleInlineEditorChange,
          }) || (
            <div style={props.containerStyle}>
              <CodeEditor
                value={String(formValues.code ?? '')}
                onChange={(code) => form.setValuesIn('code', code)}
                version={String(formValues.version ?? 'v2')}
                height={props.height}
                minHeight={props.minHeight}
                theme={props.theme}
                enableLinter={props.enableLinter}
                wrapperStyle={props.wrapperStyle}
                placeholder={`// ${tip}`}
                scene={props.scene}
                readonly={readonly}
              />
            </div>
          )
        : null}
    </Space>
  );
};

const LightExtensionSourceWorkspaceEditor: React.FC<RunJSEditorProviderRenderProps> = (props) => {
  const { locator, onPreview, sourceLocator, surfaceStyle, value } = props;
  const effectiveLocator = sourceLocator || locator;
  const translate = props.t;
  const binding = isLightExtensionRuntimeSourceBinding(props.value.sourceBinding) ? props.value.sourceBinding : null;
  const [currentBinding, setCurrentBinding] = React.useState(binding);
  const [footerActions, setFooterActions] = React.useState<LightExtensionWorkspaceFooterActions | null>(null);
  const flowContext = useFlowContext<LightExtensionEditorFlowContext | null>();
  const app = React.useContext(ApplicationContext) as ApplicationWithApi | null;
  const api = flowContext?.api || app?.apiClient;
  const editorView = flowContext?.view as LightExtensionEditorView | undefined;
  const workspaceScope = currentBinding ? getEntryWorkspaceScope(currentBinding) : null;
  const readonly = Boolean(props.readOnly || props.disabled);
  const previewAppliedRef = React.useRef(false);
  const persistedPreviewValueRef = React.useRef(value);
  const previewValueApplierRef = React.useRef<(value: RunJSValue) => Promise<boolean>>(async () => false);

  React.useEffect(() => {
    setCurrentBinding(binding);
    if (!binding || !api) {
      return;
    }

    let active = true;
    getLightExtensionEntry(api, binding.entryId)
      .then((entry) => {
        if (!active || entry.id !== binding.entryId || entry.repoId !== binding.repoId || entry.kind !== binding.kind) {
          return;
        }
        setCurrentBinding({
          ...binding,
          entryName: entry.entryName,
          entryPath: entry.entryPath,
          entryTitle: entry.title || binding.entryTitle,
        });
      })
      .catch(() => {
        // Keep the persisted binding as a fallback when the current entry cannot be refreshed.
      });

    return () => {
      active = false;
    };
  }, [api, binding]);

  React.useEffect(() => {
    if (!previewAppliedRef.current) {
      persistedPreviewValueRef.current = value;
    }
  }, [value]);

  const applyPreviewValue = React.useCallback(
    async (value: RunJSValue): Promise<boolean> => {
      if (onPreview) {
        await onPreview(value);
        return true;
      }

      return applyFlowModelStepPreview(flowContext, sourceLocator || locator, surfaceStyle, value);
    },
    [flowContext, locator, onPreview, sourceLocator, surfaceStyle],
  );
  previewValueApplierRef.current = applyPreviewValue;

  const canPreview =
    Boolean(onPreview) || canApplyFlowModelStepPreview(flowContext, sourceLocator || locator, surfaceStyle);

  const restoreWorkspacePreview = React.useCallback(async () => {
    if (!previewAppliedRef.current) {
      return;
    }
    previewAppliedRef.current = false;
    await previewValueApplierRef.current(persistedPreviewValueRef.current);
  }, []);

  React.useEffect(() => {
    return () => {
      if (!previewAppliedRef.current) {
        return;
      }
      previewAppliedRef.current = false;
      previewValueApplierRef
        .current(persistedPreviewValueRef.current)
        .catch((error) => console.error('Failed to restore light extension workspace preview', error));
    };
  }, []);

  const handleWorkspacePreview = React.useCallback(
    async (artifact: LightExtensionEntryRuntimeArtifact) => {
      const applied = await applyPreviewValue({
        ...value,
        code: artifact.code,
        version: artifact.version,
        sourceMode: INLINE_SOURCE_MODE,
      });
      previewAppliedRef.current = applied;
    },
    [applyPreviewValue, value],
  );

  const closeEditorViewWithoutRestore = React.useCallback(async () => {
    if (typeof editorView?.close === 'function') {
      await editorView.close();
      return;
    }

    editorView?.destroy?.();
  }, [editorView]);
  const closeEditorView = React.useCallback(async () => {
    await restoreWorkspacePreview();
    await closeEditorViewWithoutRestore();
  }, [closeEditorViewWithoutRestore, restoreWorkspacePreview]);

  const handleMoveToInline = React.useCallback(
    async (request: LightExtensionMoveToInlineRequest) => {
      if (!api || !currentBinding || !workspaceScope || effectiveLocator?.kind !== 'flowModel.step') {
        throw new Error(translate?.('RunJS source service is unavailable') || 'RunJS source service is unavailable');
      }

      const result = await moveLightExtensionToInline(api, {
        locator: {
          ...effectiveLocator,
          paramPath: [...effectiveLocator.paramPath],
          versionPath: effectiveLocator.versionPath ? [...effectiveLocator.versionPath] : undefined,
        },
        repoId: currentBinding.repoId,
        entryId: currentBinding.entryId,
        entryPath: request.entryPath,
        kind: workspaceScope.kind,
        version: request.version,
        files: request.files,
      });
      const nextValue = {
        ...value,
        code: result.code,
        version: result.version,
        sourceMode: INLINE_SOURCE_MODE,
        sourceBinding: undefined,
        sourceRef: result.sourceRef,
      };
      previewAppliedRef.current = false;
      persistedPreviewValueRef.current = nextValue;
      (props.onPersistedChange || props.onChange)?.(nextValue);
      await closeEditorViewWithoutRestore();
    },
    [
      closeEditorViewWithoutRestore,
      currentBinding,
      api,
      effectiveLocator,
      props.onChange,
      props.onPersistedChange,
      translate,
      value,
      workspaceScope,
    ],
  );
  const handlePersistedChange = React.useCallback(() => {
    (props.onPersistedChange || props.onChange)?.({
      ...props.value,
      ...(currentBinding ? { sourceBinding: currentBinding } : {}),
    });
  }, [currentBinding, props.onChange, props.onPersistedChange, props.value]);

  React.useEffect(() => {
    if (typeof editorView?.setFooter !== 'function') {
      return;
    }

    if (!footerActions) {
      editorView.setFooter(null);
      return;
    }

    editorView.setFooter(
      <Space>
        <Button disabled={footerActions.loading} onClick={footerActions.onCancel}>
          {translate?.('Cancel') || 'Cancel'}
        </Button>
        <Button
          disabled={footerActions.disabled}
          loading={footerActions.loading}
          onClick={footerActions.onSave}
          type="primary"
        >
          {translate?.('Save') || 'Save'}
        </Button>
      </Space>,
    );

    return () => {
      editorView.setFooter?.(null);
    };
  }, [editorView, footerActions, translate]);

  if (!currentBinding || !workspaceScope) {
    return <Alert message={props.t?.('Selected light extension entry is unavailable')} showIcon type="error" />;
  }

  return (
    <Flex
      data-testid="light-extension-source-workspace-editor"
      vertical
      style={{ height: 'calc(100vh - 96px)', minHeight: 0, minWidth: 0, overflow: 'hidden' }}
    >
      <LightExtensionWorkspacePage
        defaultFilesCollapsed
        embedded
        entryId={currentBinding.entryId}
        initialPath={currentBinding.entryPath}
        onFooterActionsChange={setFooterActions}
        onMoveToInline={
          workspaceScope.kind === 'js-block' && effectiveLocator?.kind === 'flowModel.step' && api && !readonly
            ? handleMoveToInline
            : undefined
        }
        onPreview={canPreview ? handleWorkspacePreview : undefined}
        onRequestClose={closeEditorView}
        onSaved={handlePersistedChange}
        repoId={currentBinding.repoId}
        workspaceScope={workspaceScope}
      />
    </Flex>
  );
};

export function createRunJSLightExtensionEditorProvider(): RunJSEditorProvider {
  return {
    key: 'light-extension-runjs-value',
    priority: 100,
    canHandle(props) {
      const locator = props.sourceLocator || props.locator;
      if (locator?.kind === 'flowModel.step' && props.value.sourceMode === LIGHT_EXTENSION_SOURCE_MODE) {
        return true;
      }
      if (props.value.sourceMode !== LIGHT_EXTENSION_SOURCE_MODE) {
        return false;
      }
      if (props.surfaceStyle === 'value') {
        return !locator || locator.kind === 'flowModel.nestedRunJS';
      }
      return props.surfaceStyle === 'action' && locator?.kind === 'flowModel.nestedRunJS';
    },
    renderEditor(props) {
      const locator = props.sourceLocator || props.locator;
      if (locator?.kind === 'flowModel.step' && props.value.sourceMode === LIGHT_EXTENSION_SOURCE_MODE) {
        return <LightExtensionSourceWorkspaceEditor {...props} />;
      }
      return <RunJSLightExtensionEditor {...props} />;
    },
  };
}

function getEntryWorkspaceScope(binding: LightExtensionRuntimeSourceBinding): LightExtensionEntryWorkspaceScope | null {
  if (
    typeof binding.entryPath !== 'string' ||
    !binding.entryPath.trim() ||
    !(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(binding.kind)
  ) {
    return null;
  }

  return {
    mode: 'entry',
    entryPath: binding.entryPath,
    kind: binding.kind as LightExtensionKind,
  };
}

function canApplyFlowModelStepPreview(
  flowContext: LightExtensionEditorFlowContext | null,
  locator: RunJSSourceLocator | undefined,
  surfaceStyle: RunJSEditorProviderRenderProps['surfaceStyle'],
): locator is FlowModelStepLocator {
  return Boolean(flowContext?.model && locator?.kind === 'flowModel.step' && surfaceStyle === 'render');
}

async function applyFlowModelStepPreview(
  flowContext: LightExtensionEditorFlowContext | null,
  locator: RunJSSourceLocator | undefined,
  surfaceStyle: RunJSEditorProviderRenderProps['surfaceStyle'],
  value: RunJSValue,
): Promise<boolean> {
  if (!canApplyFlowModelStepPreview(flowContext, locator, surfaceStyle)) {
    return false;
  }

  const model = flowContext.model;
  if (!model) {
    return false;
  }
  const currentParams = cloneJsonRecordValue(model.getStepParams(locator.flowKey, locator.stepKey));
  setPreviewValueAtPath(currentParams, locator.paramPath, value.code);
  setPreviewValueAtPath(
    currentParams,
    locator.versionPath?.length ? locator.versionPath : resolvePreviewVersionPath(locator.paramPath),
    value.version,
  );
  const sourceConfigPath = locator.paramPath.slice(0, -1);
  setPreviewValueAtPath(currentParams, [...sourceConfigPath, 'sourceMode'], value.sourceMode);
  if (Object.prototype.hasOwnProperty.call(value, 'sourceBinding')) {
    setPreviewValueAtPath(currentParams, [...sourceConfigPath, 'sourceBinding'], value.sourceBinding);
  }
  if (Object.prototype.hasOwnProperty.call(value, 'settings')) {
    setPreviewValueAtPath(currentParams, [...sourceConfigPath, 'settings'], value.settings);
  }
  model.setStepParams(locator.flowKey, locator.stepKey, currentParams);
  model.invalidateFlowCache('beforeRender', true);
  await model.rerender();
  return true;
}

function cloneJsonRecordValue(value: unknown): ParamObject {
  return isRecord(value) ? (cloneJsonRecord(value) as ParamObject) : {};
}

function resolvePreviewVersionPath(paramPath: readonly string[]): string[] {
  return paramPath.length > 1 ? [...paramPath.slice(0, -1), 'version'] : ['version'];
}

function setPreviewValueAtPath(root: Record<string, unknown>, path: readonly string[], value: unknown): void {
  if (!path.length || path.some((segment) => UNSAFE_RUNJS_PATH_SEGMENTS.has(segment))) {
    return;
  }

  let target = root;
  for (const segment of path.slice(0, -1)) {
    const next = cloneJsonRecordValue(target[segment]);
    target[segment] = next;
    target = next;
  }
  target[path[path.length - 1]] = value;
}
