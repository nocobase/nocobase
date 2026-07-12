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
import { CodeEditor, type RunJSEditorProvider, type RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import { useFlowContext, type FlowEngineContext, type RunJSValue } from '@nocobase/flow-engine';
import { Alert, Button, Flex, Space } from 'antd';
import React from 'react';

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import type { LightExtensionKind, LightExtensionRuntimeSourceBinding } from '../../shared/types';
import { getLightExtensionEntry, type ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { isLightExtensionRuntimeSourceBinding } from '../resolvers/LightExtensionRunJSResolver';
import LightExtensionWorkspacePage, {
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
};

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
  const translate = props.t;
  const binding = isLightExtensionRuntimeSourceBinding(props.value.sourceBinding) ? props.value.sourceBinding : null;
  const [currentBinding, setCurrentBinding] = React.useState(binding);
  const [footerActions, setFooterActions] = React.useState<LightExtensionWorkspaceFooterActions | null>(null);
  const flowContext = useFlowContext<LightExtensionEditorFlowContext | null>();
  const editorView = flowContext?.view as LightExtensionEditorView | undefined;
  const workspaceScope = currentBinding ? getEntryWorkspaceScope(currentBinding) : null;

  React.useEffect(() => {
    setCurrentBinding(binding);
    if (!binding || !flowContext?.api) {
      return;
    }

    let active = true;
    getLightExtensionEntry(flowContext.api, binding.entryId)
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
  }, [binding, flowContext?.api]);

  const closeEditorView = React.useCallback(async () => {
    if (typeof editorView?.close === 'function') {
      await editorView.close();
      return;
    }

    editorView?.destroy?.();
  }, [editorView]);
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
        initialPath={currentBinding.entryPath}
        onFooterActionsChange={setFooterActions}
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

function getEntryWorkspaceScope(binding: LightExtensionRuntimeSourceBinding): LightExtensionWorkspaceScope | null {
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
