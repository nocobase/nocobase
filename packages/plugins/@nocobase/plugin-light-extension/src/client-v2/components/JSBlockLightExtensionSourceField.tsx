/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApplicationContext, type EmbeddedRunJSEditorController } from '@nocobase/client-v2';
import { useFlowContext, type RunJSValue } from '@nocobase/flow-engine';
import type { Field } from '@formily/core';
import { useField, useForm } from '@formily/react';
import { Alert, Button, Modal, Select, Space, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionKind,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';
import { resolveLightExtensionRuntimeSource } from '../resolvers/LightExtensionRunJSResolver';
import LightExtensionWorkspacePage, {
  type LightExtensionWorkspaceFooterActions,
} from '../pages/LightExtensionWorkspacePage';
import type { LightExtensionWorkspaceScope } from '../workspace/lightExtensionWorkspaceAccess';
import {
  formatSettingsValidationErrors,
  normalizeSettingsForSchema,
  SettingsAutoForm,
  type SettingsValidationResult,
} from './SettingsAutoForm';

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
  showEntryWorkspace?: boolean;
  onEmbeddedEditorControllerChange?: (controller: EmbeddedRunJSEditorController | null) => void;
  onPreview?: (value: RunJSValue) => void | Promise<void>;
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
  return binding.entryTitle || binding.entryName || binding.entryId || binding.repoTitle || binding.repoId;
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
  showEntryWorkspace = false,
  onEmbeddedEditorControllerChange,
  onPreview,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const form = useForm();
  const field = useField<Field>();
  const ctx = useFlowContext<FlowContextWithApi | null>();
  const app = React.useContext(ApplicationContext) as ApplicationWithApi | null;
  const api = ctx?.api || app?.apiClient;
  const [, rerender] = React.useReducer((count: number) => count + 1, 0);
  const [settingsValidation, setSettingsValidation] = React.useState<SettingsValidationResult>({
    value: {},
    errors: [],
  });
  const [copying, setCopying] = React.useState(false);
  const [sourceEntries, setSourceEntries] = React.useState<LightExtensionSelectableEntrySummary[]>([]);
  const [sourceEntriesLoading, setSourceEntriesLoading] = React.useState(false);
  const [sourceEntriesError, setSourceEntriesError] = React.useState<string | null>(null);
  const [workspaceFooterActions, setWorkspaceFooterActions] =
    React.useState<LightExtensionWorkspaceFooterActions | null>(null);

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
  const workspaceEntryPath = selectedEntry?.entryPath || sourceBinding?.entryPath || null;
  const entryWorkspaceScope = React.useMemo<LightExtensionWorkspaceScope | null>(() => {
    if (!showEntryWorkspace || !workspaceEntryPath || sourceBinding?.kind !== 'runjs') {
      return null;
    }
    return {
      mode: 'entry',
      entryPath: workspaceEntryPath,
      kind: 'runjs',
    };
  }, [showEntryWorkspace, sourceBinding?.kind, workspaceEntryPath]);
  const hasSettings = Boolean(selectedEntry && getSettingsSchemaPropertyNames(selectedEntry.settingsSchema)?.size);

  React.useEffect(() => {
    if (
      showEntryWorkspace ||
      sourceMode !== LIGHT_EXTENSION_SOURCE_MODE ||
      typeof ctx?.view?.setFooter !== 'function'
    ) {
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
  }, [ctx?.view, showEntryWorkspace, sourceMode, t]);

  React.useEffect(() => {
    if (!showEntryWorkspace || !workspaceFooterActions) {
      onEmbeddedEditorControllerChange?.(null);
      return;
    }
    onEmbeddedEditorControllerChange?.({
      dirty: workspaceFooterActions.dirty,
      saving: workspaceFooterActions.loading,
      requestSave: workspaceFooterActions.requestSave,
    });
    return () => {
      onEmbeddedEditorControllerChange?.(null);
    };
  }, [onEmbeddedEditorControllerChange, showEntryWorkspace, workspaceFooterActions]);

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
      setSettingsValidation({
        value: {},
        errors: [],
      });
      return;
    }

    if (!selectedEntry) {
      return;
    }

    setSettingsValidation(normalizeSettingsForSchema(selectedEntry.settingsSchema, values.settings));
  }, [selectedEntry, sourceBinding, values.settings]);

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
    const defaults = extractSettingsDefaults(entry.settingsSchema);
    form.setValuesIn('sourceMode', LIGHT_EXTENSION_SOURCE_MODE);
    form.setValuesIn('sourceBinding', nextBinding);
    form.setValuesIn('settings', mergeSettings(defaults, values.settings, entry.settingsSchema));
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

  const handleSettingsChange = (nextSettings: Record<string, unknown>, validation: SettingsValidationResult) => {
    form.setValuesIn('settings', nextSettings);
    setSettingsValidation(validation);
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

  const handleWorkspacePreview = React.useCallback(
    async (artifact: LightExtensionEntryRuntimeArtifact) => {
      if (!onPreview) {
        return;
      }
      await onPreview({
        code: artifact.code,
        version: artifact.version,
        sourceMode: INLINE_SOURCE_MODE,
        ...(sourceBinding ? { sourceBinding: { ...sourceBinding } } : {}),
        settings: isRecord(values.settings) ? { ...values.settings } : {},
      });
    },
    [onPreview, sourceBinding, values.settings],
  );

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
        hasSettings || !entryWorkspaceScope ? (
          <SettingsAutoForm
            schema={selectedEntry.settingsSchema}
            value={values.settings}
            disabled={disabled}
            onChange={handleSettingsChange}
          />
        ) : null
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
      {sourceBinding && entryWorkspaceScope ? (
        <div style={{ height: 480, minHeight: 360, minWidth: 0, overflow: 'hidden' }}>
          <LightExtensionWorkspacePage
            defaultFilesCollapsed
            embedded
            entryId={sourceBinding.entryId}
            initialPath={workspaceEntryPath || undefined}
            onFooterActionsChange={setWorkspaceFooterActions}
            onPreview={onPreview ? handleWorkspacePreview : undefined}
            repoId={sourceBinding.repoId}
            workspaceScope={entryWorkspaceScope}
          />
        </div>
      ) : null}
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

export const RunJSLightExtensionSourceField: React.FC<Omit<JSBlockLightExtensionSourceFieldProps, 'kind'>> = (
  props,
) => <JSBlockLightExtensionSourceField {...props} kind="runjs" />;

function mergeSettings(
  defaults: Record<string, unknown>,
  current: Record<string, unknown> | undefined,
  settingsSchema: Record<string, unknown> | null,
): Record<string, unknown> {
  const allowedSettings = getSettingsSchemaPropertyNames(settingsSchema);
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
  return entry.title || entry.entryName || entry.id;
}

function extractSettingsDefaults(schema: Record<string, unknown> | null): Record<string, unknown> {
  return normalizeSettingsForSchema(schema, {}).value;
}

export default JSBlockLightExtensionSourceField;
