/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Field } from '@formily/core';
import { useField, useForm } from '@formily/react';
import { Alert, Button, Modal, Radio, Space, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useFlowContext } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionPublicationMetadataRecord,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSourceBindingVersionPolicy,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { resolveLightExtensionRuntimeSource } from '../resolvers/LightExtensionRunJSResolver';
import { RepoEntryPublicationSelector } from './RepoEntryPublicationSelector';
import { formatSettingsValidationErrors, SettingsAutoForm, type SettingsValidationResult } from './SettingsAutoForm';
import { VersionPolicyField } from './VersionPolicyField';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

type FlowContextWithApi = {
  api: ApiClientLike;
  view?: {
    close?: () => void;
    setFooter?: (footer: React.ReactNode) => void;
    submit?: () => void | Promise<void>;
  };
};

type JSBlockRunJSFormValues = {
  code?: string;
  version?: string;
  sourceMode?: string;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  settings?: Record<string, unknown>;
};

export interface JSBlockLightExtensionSourceFieldProps {
  value?: string | LightExtensionRuntimeSourceBinding | null;
  onChange?: (value: string | LightExtensionRuntimeSourceBinding | undefined) => void;
  disabled?: boolean;
  kind?: LightExtensionKind;
  defaultVersionPolicy?: LightExtensionSourceBindingVersionPolicy;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLightExtensionBinding(
  value: unknown,
  expectedKind: LightExtensionKind,
): value is LightExtensionRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === 'light-extension-entry' &&
    typeof value.repoId === 'string' &&
    value.repoId.trim().length > 0 &&
    typeof value.entryId === 'string' &&
    value.entryId.trim().length > 0 &&
    value.kind === expectedKind &&
    typeof value.publicationId === 'string' &&
    value.publicationId.trim().length > 0 &&
    (typeof value.versionPolicy === 'undefined' ||
      value.versionPolicy === 'pinned' ||
      value.versionPolicy === 'follow-active')
  );
}

function setFieldErrors(field: Field, errors: string[]) {
  const target = field as Field & {
    setSelfErrors?: (messages: string[] | string) => void;
    selfErrors?: string[];
  };
  if (typeof target.setSelfErrors === 'function') {
    target.setSelfErrors(errors);
    return;
  }
  target.selfErrors = errors;
}

function getFieldPath(field: Field): string {
  return field.path?.toString() || '';
}

export const JSBlockLightExtensionSourceField: React.FC<JSBlockLightExtensionSourceFieldProps> = ({
  value,
  onChange,
  disabled,
  kind = 'js-block',
  defaultVersionPolicy = 'follow-active',
}) => {
  const { t } = useTranslation(NAMESPACE);
  const form = useForm();
  const field = useField<Field>();
  const ctx = useFlowContext<FlowContextWithApi>();
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  const [selectedPublication, setSelectedPublication] = React.useState<LightExtensionPublicationMetadataRecord | null>(
    null,
  );
  const [settingsValidation, setSettingsValidation] = React.useState<SettingsValidationResult>({
    value: {},
    errors: [],
  });
  const [copying, setCopying] = React.useState(false);

  const values = form.values as JSBlockRunJSFormValues;
  const rendersSourceModeControl = typeof value === 'string' || getFieldPath(field) === 'sourceMode';
  const sourceMode =
    (rendersSourceModeControl && typeof value === 'string' ? value : values.sourceMode) || INLINE_SOURCE_MODE;
  const sourceBindingFromValue = isLightExtensionBinding(value, kind) ? value : undefined;
  const sourceBinding =
    sourceBindingFromValue || (isLightExtensionBinding(values.sourceBinding, kind) ? values.sourceBinding : undefined);
  const hasSourceBinding = Boolean(sourceBinding);

  React.useEffect(() => {
    if (sourceMode !== LIGHT_EXTENSION_SOURCE_MODE || typeof ctx?.view?.setFooter !== 'function') {
      return;
    }

    ctx.view.setFooter(
      <Space align="end">
        <Button onClick={() => ctx.view?.close?.()}>{t('Cancel')}</Button>
        <Button type="primary" onClick={() => ctx.view?.submit?.()}>
          {t('Save')}
        </Button>
      </Space>,
    );

    return () => {
      ctx.view?.setFooter?.(null);
    };
  }, [ctx?.view, sourceMode, t]);

  React.useEffect(() => {
    const subscriptionId = form.subscribe(() => {
      rerender();
    });
    return () => {
      form.unsubscribe(subscriptionId);
    };
  }, [form]);

  React.useEffect(() => {
    if (!rendersSourceModeControl || values.sourceMode) {
      return;
    }
    form.setValuesIn('sourceMode', INLINE_SOURCE_MODE);
    onChange?.(INLINE_SOURCE_MODE);
  }, [form, onChange, rendersSourceModeControl, values.sourceMode]);

  React.useEffect(() => {
    const errors =
      sourceMode === LIGHT_EXTENSION_SOURCE_MODE
        ? [
            ...(hasSourceBinding ? [] : [String(t('Select a light extension entry'))]),
            ...formatSettingsValidationErrors(settingsValidation.errors, t),
          ]
        : [];
    setFieldErrors(field, errors);
  }, [field, hasSourceBinding, settingsValidation.errors, sourceMode, t]);

  React.useEffect(() => {
    if (!sourceBinding) {
      setSelectedPublication(null);
      setSettingsValidation({
        value: {},
        errors: [],
      });
      return;
    }

    if (
      selectedPublication &&
      (selectedPublication.id !== sourceBinding.publicationId ||
        selectedPublication.entryId !== sourceBinding.entryId ||
        selectedPublication.repoId !== sourceBinding.repoId)
    ) {
      setSelectedPublication(null);
      setSettingsValidation({
        value: {},
        errors: [],
      });
    }
  }, [selectedPublication, sourceBinding]);

  const setSourceMode = (nextMode: string) => {
    form.setValuesIn('sourceMode', nextMode);
    if (nextMode !== LIGHT_EXTENSION_SOURCE_MODE) {
      setSettingsValidation({
        value: {},
        errors: [],
      });
    }
    onChange?.(nextMode);
  };

  const handleModeChange = (nextMode: string) => {
    if (nextMode === sourceMode) {
      return;
    }

    if (nextMode !== INLINE_SOURCE_MODE) {
      setSourceMode(nextMode);
      return;
    }

    if (!sourceBinding) {
      setSourceMode(INLINE_SOURCE_MODE);
      return;
    }

    Modal.confirm({
      title: t('Switch to inline code?'),
      content: t(
        'You can copy the selected light extension code into the inline editor, or keep the existing inline code.',
      ),
      okText: t('Copy code'),
      cancelText: t('Keep existing code'),
      onOk: async () => {
        await copyPublicationToInline();
        setSourceMode(INLINE_SOURCE_MODE);
      },
      onCancel: () => {
        setSourceMode(INLINE_SOURCE_MODE);
      },
    });
  };

  const handleSelectorChange = (
    binding: LightExtensionRuntimeSourceBinding,
    publication: LightExtensionPublicationMetadataRecord,
    defaults: Record<string, unknown>,
  ) => {
    const preservesCurrentSelection =
      sourceBinding?.repoId === binding.repoId &&
      sourceBinding.entryId === binding.entryId &&
      sourceBinding.kind === binding.kind;
    const nextBinding: LightExtensionRuntimeSourceBinding = {
      ...binding,
      versionPolicy: getNextLightExtensionSourceBindingVersionPolicy({
        sourceBinding,
        binding,
        defaultVersionPolicy,
      }),
    };
    form.setValuesIn('sourceBinding', nextBinding);
    form.setValuesIn('settings', mergeSettings(defaults, values.settings, publication));
    if (!rendersSourceModeControl) {
      onChange?.(nextBinding);
    }
    setSelectedPublication(publication);
  };

  const handleSelectorClear = () => {
    setSelectedPublication(null);
    form.setValuesIn('sourceBinding', undefined);
    form.setValuesIn('settings', {});
    if (!rendersSourceModeControl) {
      onChange?.(undefined);
    }
    setSettingsValidation({
      value: {},
      errors: [],
    });
  };

  const handleSettingsChange = (nextSettings: Record<string, unknown>, validation: SettingsValidationResult) => {
    form.setValuesIn('settings', nextSettings);
    setSettingsValidation(validation);
  };

  const handleVersionPolicyChange = (versionPolicy: LightExtensionSourceBindingVersionPolicy) => {
    if (!sourceBinding) {
      return;
    }
    const nextBinding: LightExtensionRuntimeSourceBinding = {
      ...sourceBinding,
      versionPolicy,
    };
    form.setValuesIn('sourceBinding', nextBinding);
    if (!rendersSourceModeControl) {
      onChange?.(nextBinding);
    }
  };

  const copyPublicationToInline = async () => {
    if (!sourceBinding) {
      return;
    }

    setCopying(true);
    try {
      const resolved = await resolveLightExtensionRuntimeSource(ctx.api, {
        sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
        sourceBinding,
        settings: values.settings || {},
      });
      form.setValuesIn('code', resolved.code);
      form.setValuesIn('version', resolved.version || 'v2');
    } finally {
      setCopying(false);
    }
  };

  const lightExtensionBinding = (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <RepoEntryPublicationSelector
        disabled={disabled}
        kind={kind}
        value={values.sourceBinding}
        onChange={handleSelectorChange}
        onClear={handleSelectorClear}
      />
      {sourceBinding ? (
        <VersionPolicyField
          disabled={disabled}
          value={sourceBinding.versionPolicy || defaultVersionPolicy}
          onChange={handleVersionPolicyChange}
        />
      ) : null}
      {selectedPublication ? (
        <SettingsAutoForm
          schema={selectedPublication.settingsSchemaSnapshot}
          value={values.settings}
          disabled={disabled}
          onChange={handleSettingsChange}
        />
      ) : (
        <Alert type="info" showIcon message={t('Select a light extension entry to configure settings')} />
      )}
      {copying ? <Typography.Text type="secondary">{t('Copying light extension code')}</Typography.Text> : null}
    </Space>
  );

  if (!rendersSourceModeControl) {
    return sourceMode === LIGHT_EXTENSION_SOURCE_MODE ? lightExtensionBinding : null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Radio.Group
        disabled={disabled}
        value={sourceMode}
        optionType="button"
        buttonStyle="solid"
        onChange={(event) => handleModeChange(event.target.value)}
        options={[
          { label: t('Inline code'), value: INLINE_SOURCE_MODE },
          { label: t('Light extension'), value: LIGHT_EXTENSION_SOURCE_MODE },
        ]}
      />
      {sourceMode === LIGHT_EXTENSION_SOURCE_MODE ? (
        lightExtensionBinding
      ) : (
        <Button
          disabled={disabled || !sourceBinding}
          loading={copying}
          onClick={copyPublicationToInline}
          style={{ width: 'fit-content' }}
        >
          {t('Copy selected light extension code')}
        </Button>
      )}
    </Space>
  );
};

export const JSFieldLightExtensionSourceField: React.FC<
  Omit<JSBlockLightExtensionSourceFieldProps, 'kind' | 'defaultVersionPolicy'>
> = (props) => <JSBlockLightExtensionSourceField {...props} kind="js-field" defaultVersionPolicy="pinned" />;

export const JSActionLightExtensionSourceField: React.FC<
  Omit<JSBlockLightExtensionSourceFieldProps, 'kind' | 'defaultVersionPolicy'>
> = (props) => <JSBlockLightExtensionSourceField {...props} kind="js-action" defaultVersionPolicy="pinned" />;

export const JSItemLightExtensionSourceField: React.FC<
  Omit<JSBlockLightExtensionSourceFieldProps, 'kind' | 'defaultVersionPolicy'>
> = (props) => <JSBlockLightExtensionSourceField {...props} kind="js-item" defaultVersionPolicy="pinned" />;

export function getNextLightExtensionSourceBindingVersionPolicy(input: {
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  binding: LightExtensionRuntimeSourceBinding;
  defaultVersionPolicy: LightExtensionSourceBindingVersionPolicy;
}): LightExtensionSourceBindingVersionPolicy {
  const { sourceBinding, binding, defaultVersionPolicy } = input;
  const preservesCurrentSelection =
    sourceBinding?.repoId === binding.repoId &&
    sourceBinding.entryId === binding.entryId &&
    sourceBinding.kind === binding.kind;
  if (!preservesCurrentSelection) {
    return defaultVersionPolicy;
  }
  if (sourceBinding.publicationId !== binding.publicationId && binding.versionPolicy === 'pinned') {
    return 'pinned';
  }
  return sourceBinding.versionPolicy || 'pinned';
}

function mergeSettings(
  defaults: Record<string, unknown>,
  current: Record<string, unknown> | undefined,
  publication: LightExtensionPublicationMetadataRecord,
): Record<string, unknown> {
  const allowedSettings = getSettingsSchemaPropertyNames(publication.settingsSchemaSnapshot);
  if (!allowedSettings) {
    return {
      ...defaults,
      ...(isRecord(current) ? current : {}),
    };
  }

  return {
    ...defaults,
    ...(isRecord(current)
      ? Object.fromEntries(Object.entries(current).filter(([key]) => allowedSettings.has(key)))
      : {}),
  };
}

function getSettingsSchemaPropertyNames(schema: unknown): Set<string> | null {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return null;
  }
  return new Set(Object.keys(schema.properties));
}

export default JSBlockLightExtensionSourceField;
