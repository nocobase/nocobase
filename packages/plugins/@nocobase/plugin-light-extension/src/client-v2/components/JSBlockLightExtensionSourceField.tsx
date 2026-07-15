/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApplicationContext, validateRunJSSettings } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import type { Field } from '@formily/core';
import { useField, useForm } from '@formily/react';
import { Alert, Button, Modal, Select, Space, Typography } from 'antd';
import React from 'react';
import {
  extractRunJSSettingsDefaults,
  normalizeLightExtensionEntrySelection,
  normalizeLightExtensionSettings,
} from '@nocobase/runjs/settings';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';
import { resolveLightExtensionRuntimeSource } from '../resolvers/LightExtensionRunJSResolver';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
const INLINE_SOURCE_SELECT_VALUE = INLINE_SOURCE_MODE;

type FlowContextWithApi = {
  api?: ApiClientLike;
  view?: {
    close?: () => void;
    setFooter?: (footer: React.ReactNode) => void;
    submit?: () => void | Promise<void>;
  };
};

type ApplicationWithApi = {
  apiClient?: ApiClientLike;
};

type JSBlockRunJSFormValues = {
  code?: string;
  version?: string;
  sourceMode?: string;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  settings?: Record<string, unknown>;
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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getSettingsSchemaPropertyNames(schema: unknown): Set<string> | null {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return null;
  }
  return new Set(Object.keys(schema.properties));
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
    Object.keys(value).every((key) => LIGHT_EXTENSION_SOURCE_BINDING_KEYS.has(key))
  );
}

const LIGHT_EXTENSION_SOURCE_BINDING_KEYS = new Set([
  'type',
  'repoId',
  'repoTitle',
  'entryId',
  'entryTitle',
  'entryName',
  'entryPath',
  'kind',
]);

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

function getEntrySelectValue(entry: Pick<LightExtensionSelectableEntrySummary, 'id' | 'repoId'>): string {
  return `${LIGHT_EXTENSION_SOURCE_MODE}:${entry.repoId}:${entry.id}`;
}

function getBindingSelectValue(binding: Pick<LightExtensionRuntimeSourceBinding, 'entryId' | 'repoId'>): string {
  return `${LIGHT_EXTENSION_SOURCE_MODE}:${binding.repoId}:${binding.entryId}`;
}

function getBindingLabel(binding: LightExtensionRuntimeSourceBinding): string {
  return binding.entryName || binding.entryTitle || binding.entryId || binding.repoTitle || binding.repoId;
}

function getBindingDisplayLabel(binding: LightExtensionRuntimeSourceBinding, sourceLabel: string): string {
  const repoLabel = binding.repoTitle || binding.repoId;
  const entryLabel = getBindingLabel(binding);
  const bindingLabel = repoLabel && entryLabel !== repoLabel ? `${repoLabel} / ${entryLabel}` : entryLabel;
  return `${sourceLabel} / ${bindingLabel}`;
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
}) => {
  const { t } = useTranslation(NAMESPACE);
  const form = useForm();
  const field = useField<Field>();
  const ctx = useFlowContext<FlowContextWithApi | null>();
  const app = React.useContext(ApplicationContext) as ApplicationWithApi | null;
  const api = ctx?.api || app?.apiClient;
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  const [copying, setCopying] = React.useState(false);
  const [sourceEntries, setSourceEntries] = React.useState<LightExtensionSelectableEntrySummary[]>([]);
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
  const selectedEntry = React.useMemo(
    () =>
      sourceBinding
        ? sourceEntries.find(
            (entry) =>
              entry.repoId === sourceBinding.repoId &&
              entry.id === sourceBinding.entryId &&
              entry.kind === sourceBinding.kind,
          ) || null
        : null,
    [sourceBinding, sourceEntries],
  );
  const hasSettings = Boolean(selectedEntry && getSettingsSchemaPropertyNames(selectedEntry.settingsSchema)?.size);
  const settingsStatus = React.useMemo(() => {
    if (!selectedEntry || !isRecord(selectedEntry.settingsSchema) || !hasSettings) {
      return { kind: 'none' as const, missingCount: 0 };
    }
    const validation = validateRunJSSettings({
      schema: selectedEntry.settingsSchema,
      settings: normalizeLightExtensionSettings(
        {
          schema: selectedEntry.settingsSchema,
          defaults: extractRunJSSettingsDefaults(selectedEntry.settingsSchema),
        },
        values.settings,
      ),
      mode: 'binding',
    });
    if (validation.errors.length > 0) {
      return { kind: 'invalid' as const, missingCount: 0 };
    }
    const missingCount = new Set(validation.missingRequiredPaths.map((path) => path.split('.')[0]).filter(Boolean))
      .size;
    return missingCount > 0
      ? { kind: 'missing' as const, missingCount }
      : { kind: 'complete' as const, missingCount: 0 };
  }, [hasSettings, selectedEntry, values.settings]);

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
    if (!rendersSourceModeControl && sourceMode !== LIGHT_EXTENSION_SOURCE_MODE) {
      return;
    }
    if (!api) {
      setSourceEntries([]);
      setSourceEntriesLoading(false);
      setSourceEntriesError(null);
      return;
    }

    let mounted = true;
    setSourceEntriesLoading(true);
    setSourceEntriesError(null);
    const loadSourceEntries = async () => {
      try {
        const entries = await listSelectableLightExtensionEntries(api, { kind });
        if (!mounted) {
          return;
        }
        setSourceEntries(entries.filter((entry) => entry.kind === kind && entry.runtimeAvailable === true));
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
  }, [api, kind, rendersSourceModeControl, sourceMode, t]);

  React.useEffect(() => {
    if (!rendersSourceModeControl || values.sourceMode) {
      return;
    }
    form.setValuesIn('sourceMode', INLINE_SOURCE_MODE);
    onChange?.(INLINE_SOURCE_MODE);
  }, [form, onChange, rendersSourceModeControl, values.sourceMode]);

  React.useEffect(() => {
    setFieldErrors(
      field,
      sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !hasSourceBinding
        ? [String(t('Select a light extension entry'))]
        : [],
    );
  }, [field, hasSourceBinding, sourceMode, t]);

  const setSourceMode = (nextMode: string) => {
    form.setValuesIn('sourceMode', nextMode);
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
        await copyLightExtensionToInline();
        setSourceMode(INLINE_SOURCE_MODE);
      },
      onCancel: () => {
        setSourceMode(INLINE_SOURCE_MODE);
      },
    });
  };

  const handleSourceEntrySelect = (entry: LightExtensionSelectableEntrySummary) => {
    const nextBinding = createLightExtensionRuntimeSourceBinding(entry);
    const defaults = extractRunJSSettingsDefaults(entry.settingsSchema);
    form.setValuesIn('sourceMode', LIGHT_EXTENSION_SOURCE_MODE);
    form.setValuesIn('sourceBinding', nextBinding);
    form.setValuesIn(
      'settings',
      normalizeLightExtensionEntrySelection({
        currentBinding: sourceBinding,
        currentSettings: values.settings,
        nextBinding,
        descriptor: {
          entryId: entry.id,
          settingsSchemaHash: entry.settingsSchemaHash,
          schema: entry.settingsSchema,
          defaults,
        },
      }),
    );
    onChange?.(rendersSourceModeControl ? LIGHT_EXTENSION_SOURCE_MODE : nextBinding);
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

  const copyLightExtensionToInline = async () => {
    if (!sourceBinding || !api) {
      return;
    }

    setCopying(true);
    try {
      const resolved = await resolveLightExtensionRuntimeSource(api, {
        sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
        sourceBinding: { ...sourceBinding },
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
      {sourceBinding ? (
        <Typography.Text strong>{getBindingDisplayLabel(sourceBinding, t('Light extension'))}</Typography.Text>
      ) : null}
      {sourceBinding && selectedEntry ? (
        hasSettings ? (
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">{t('Settings are available in separate menus')}</Typography.Text>
            <Typography.Text type={settingsStatus.kind === 'complete' ? 'success' : 'warning'}>
              {settingsStatus.kind === 'complete'
                ? t('Required settings are complete')
                : settingsStatus.kind === 'missing'
                  ? `${t('Required settings remaining')}: ${settingsStatus.missingCount}`
                  : t('Settings require attention')}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">{t('No settings')}</Typography.Text>
        )
      ) : sourceBinding ? (
        <Alert
          type={sourceEntriesLoading ? 'info' : 'warning'}
          showIcon
          message={
            sourceEntriesLoading
              ? t('Loading light extension entry')
              : t('Selected light extension entry is unavailable')
          }
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
          onClick={copyLightExtensionToInline}
          style={{ width: 'fit-content' }}
        >
          {t('Copy selected light extension code')}
        </Button>
      )}
    </Space>
  );
};

export const JSFieldLightExtensionSourceField: React.FC<Omit<JSBlockLightExtensionSourceFieldProps, 'kind'>> = (
  props,
) => <JSBlockLightExtensionSourceField {...props} kind="js-field" />;

export const JSActionLightExtensionSourceField: React.FC<Omit<JSBlockLightExtensionSourceFieldProps, 'kind'>> = (
  props,
) => <JSBlockLightExtensionSourceField {...props} kind="js-action" />;

export const JSItemLightExtensionSourceField: React.FC<Omit<JSBlockLightExtensionSourceFieldProps, 'kind'>> = (
  props,
) => <JSBlockLightExtensionSourceField {...props} kind="js-item" />;

function createLightExtensionRuntimeSourceBinding(
  entry: LightExtensionSelectableEntrySummary,
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: entry.repoId,
    entryId: entry.id,
    entryTitle: getLightExtensionEntryLabel(entry),
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind: entry.kind,
  };
}

function getLightExtensionEntryLabel(entry: LightExtensionSelectableEntrySummary): string {
  return entry.entryName || entry.id;
}

export default JSBlockLightExtensionSourceField;
