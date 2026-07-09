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
import { Alert, Button, Modal, Select, Space, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useFlowContext } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionPublicationMetadataRecord,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntryRecord,
  LightExtensionSourceBindingVersionPolicy,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';
import { resolveLightExtensionRuntimeSource } from '../resolvers/LightExtensionRunJSResolver';
import {
  cloneLightExtensionPublicationDefaults,
  createLightExtensionRuntimeSourceBinding,
  getLightExtensionEntryLabel,
  hasLightExtensionActivePublication,
  RepoEntryPublicationSelector,
} from './RepoEntryPublicationSelector';
import { formatSettingsValidationErrors, SettingsAutoForm, type SettingsValidationResult } from './SettingsAutoForm';
import { VersionPolicyField } from './VersionPolicyField';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
const INLINE_SOURCE_SELECT_VALUE = INLINE_SOURCE_MODE;

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

type SelectableLightExtensionEntryWithPublication = LightExtensionSelectableEntryRecord & {
  activePublication: LightExtensionPublicationMetadataRecord;
};

type SourceSelectOption = {
  label: string;
  value: string;
  searchText: string;
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

function getEntrySelectValue(entry: Pick<LightExtensionSelectableEntryRecord, 'id' | 'repoId'>): string {
  return `${LIGHT_EXTENSION_SOURCE_MODE}:${entry.repoId}:${entry.id}`;
}

function getBindingSelectValue(binding: Pick<LightExtensionRuntimeSourceBinding, 'entryId' | 'repoId'>): string {
  return `${LIGHT_EXTENSION_SOURCE_MODE}:${binding.repoId}:${binding.entryId}`;
}

function getBindingLabel(binding: LightExtensionRuntimeSourceBinding): string {
  return binding.entryTitle || binding.entryName || binding.entryId || binding.repoTitle || binding.repoId;
}

function getErrorMessage(error: unknown): string | undefined {
  if (isRecord(error)) {
    if (typeof error.message === 'string') {
      return error.message;
    }
    const response = isRecord(error.response) ? error.response : null;
    const data = isRecord(response?.data) ? response.data : null;
    if (Array.isArray(data?.errors) && isRecord(data.errors[0]) && typeof data.errors[0].message === 'string') {
      return data.errors[0].message;
    }
  }
  return undefined;
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
  const [sourceEntries, setSourceEntries] = React.useState<SelectableLightExtensionEntryWithPublication[]>([]);
  const [sourceEntriesLoading, setSourceEntriesLoading] = React.useState(false);
  const [sourceEntriesError, setSourceEntriesError] = React.useState<string | null>(null);

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
    if (!rendersSourceModeControl) {
      return;
    }

    let mounted = true;
    setSourceEntriesLoading(true);
    setSourceEntriesError(null);
    const loadSourceEntries = async () => {
      try {
        const entries = await listSelectableLightExtensionEntries(ctx.api, { kind });
        if (!mounted) {
          return;
        }
        setSourceEntries(entries.filter((entry) => entry.kind === kind && hasLightExtensionActivePublication(entry)));
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setSourceEntries([]);
        setSourceEntriesError(getErrorMessage(requestError) || t('Failed to load entries'));
      } finally {
        if (mounted) {
          setSourceEntriesLoading(false);
        }
      }
    };
    loadSourceEntries();
    return () => {
      mounted = false;
    };
  }, [ctx.api, kind, rendersSourceModeControl, t]);

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

  const handleSourceEntrySelect = (entry: SelectableLightExtensionEntryWithPublication) => {
    const binding = createLightExtensionRuntimeSourceBinding(entry, entry.activePublication);
    const nextBinding: LightExtensionRuntimeSourceBinding = {
      ...binding,
      versionPolicy: getNextLightExtensionSourceBindingVersionPolicy({
        sourceBinding,
        binding,
        defaultVersionPolicy,
      }),
    };
    const defaults = cloneLightExtensionPublicationDefaults(entry.activePublication);
    form.setValuesIn('sourceMode', LIGHT_EXTENSION_SOURCE_MODE);
    form.setValuesIn('sourceBinding', nextBinding);
    form.setValuesIn('settings', mergeSettings(defaults, values.settings, entry.activePublication));
    setSelectedPublication(entry.activePublication);
    onChange?.(LIGHT_EXTENSION_SOURCE_MODE);
  };

  const handleSourceSelectChange = (nextValue: string) => {
    if (nextValue === INLINE_SOURCE_SELECT_VALUE) {
      handleModeChange(INLINE_SOURCE_MODE);
      return;
    }

    const entry = sourceEntries.find((item) => getEntrySelectValue(item) === nextValue);
    if (!entry) {
      return;
    }
    handleSourceEntrySelect(entry);
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

  const sourceSelectValue =
    sourceMode === LIGHT_EXTENSION_SOURCE_MODE && sourceBinding
      ? getBindingSelectValue(sourceBinding)
      : sourceMode === LIGHT_EXTENSION_SOURCE_MODE
        ? undefined
        : INLINE_SOURCE_SELECT_VALUE;
  const sourceSelectOptions = React.useMemo<SourceSelectOption[]>(() => {
    const options: SourceSelectOption[] = [
      {
        label: t('Inline code'),
        value: INLINE_SOURCE_SELECT_VALUE,
        searchText: t('Inline code'),
      },
      ...sourceEntries.map((entry) => {
        const label = getLightExtensionEntryLabel(entry);
        return {
          label,
          value: getEntrySelectValue(entry),
          searchText: [label, entry.entryName, entry.entryPath, entry.repoId, t('Light extension')]
            .filter(Boolean)
            .join(' '),
        };
      }),
    ];
    if (
      sourceMode === LIGHT_EXTENSION_SOURCE_MODE &&
      sourceBinding &&
      !options.some((option) => option.value === getBindingSelectValue(sourceBinding))
    ) {
      const label = getBindingLabel(sourceBinding);
      options.push({
        label,
        value: getBindingSelectValue(sourceBinding),
        searchText: [label, sourceBinding.entryName, sourceBinding.entryId, sourceBinding.repoId, t('Light extension')]
          .filter(Boolean)
          .join(' '),
      });
    }
    return options;
  }, [sourceBinding, sourceEntries, sourceMode, t]);

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
      <Select
        aria-label={t('Code source')}
        disabled={disabled}
        loading={sourceEntriesLoading}
        value={sourceSelectValue}
        showSearch
        optionFilterProp="searchText"
        options={sourceSelectOptions}
        onChange={handleSourceSelectChange}
        placeholder={t('Select a light extension entry')}
      />
      {sourceEntriesError ? <Alert type="error" showIcon message={sourceEntriesError} /> : null}
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

export const RunJSLightExtensionSourceField: React.FC<
  Omit<JSBlockLightExtensionSourceFieldProps, 'kind' | 'defaultVersionPolicy'>
> = (props) => <JSBlockLightExtensionSourceField {...props} kind="runjs" defaultVersionPolicy="pinned" />;

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
