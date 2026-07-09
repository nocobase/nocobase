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
import type { RunJSValue } from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';

import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
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
    sourceBinding: isRecord(value.sourceBinding)
      ? (cloneJsonRecord(value.sourceBinding) as LightExtensionRuntimeSourceBinding)
      : undefined,
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
    ...(isRecord(values.sourceBinding) ? { sourceBinding: cloneJsonRecord(values.sourceBinding) } : {}),
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
      rerender();
      if (applyingExternalValueRef.current) {
        return;
      }
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

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', minWidth: 0 }}>
      <FormProvider form={form}>
        <SchemaField
          schema={{
            type: 'object',
            properties: {
              sourceMode: {
                type: 'string',
                'x-component': 'RunJSLightExtensionSourceField',
                'x-component-props': {
                  disabled: readonly,
                },
              },
            },
          }}
        />
      </FormProvider>
      {sourceMode === INLINE_SOURCE_MODE ? (
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
      ) : null}
    </Space>
  );
};

export function createRunJSLightExtensionEditorProvider(): RunJSEditorProvider {
  return {
    key: 'light-extension-runjs-value',
    canHandle(props) {
      const locator = props.sourceLocator || props.locator;
      return locator?.kind === 'flowModel.nestedRunJS' && props.surfaceStyle === 'value';
    },
    renderEditor(props) {
      return <RunJSLightExtensionEditor {...props} />;
    },
  };
}
