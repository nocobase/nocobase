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
import type { LightExtensionPublicationMetadataRecord, LightExtensionRuntimeSourceBinding } from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { resolveLightExtensionRuntimeSource } from '../resolvers/LightExtensionRunJSResolver';
import { RepoEntryPublicationSelector } from './RepoEntryPublicationSelector';
import { formatSettingsValidationErrors, SettingsAutoForm, type SettingsValidationResult } from './SettingsAutoForm';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

type FlowContextWithApi = {
  api: ApiClientLike;
};

type JSBlockRunJSFormValues = {
  code?: string;
  version?: string;
  sourceMode?: string;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  settings?: Record<string, unknown>;
};

export interface JSBlockLightExtensionSourceFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLightExtensionBinding(value: unknown): value is LightExtensionRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === 'light-extension-entry' &&
    typeof value.repoId === 'string' &&
    value.repoId.trim().length > 0 &&
    typeof value.entryId === 'string' &&
    value.entryId.trim().length > 0 &&
    value.kind === 'js-block' &&
    typeof value.publicationId === 'string' &&
    value.publicationId.trim().length > 0 &&
    value.versionPolicy === 'pinned'
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

export const JSBlockLightExtensionSourceField: React.FC<JSBlockLightExtensionSourceFieldProps> = ({
  value,
  onChange,
  disabled,
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
  const sourceMode = value || values.sourceMode || INLINE_SOURCE_MODE;
  const sourceBinding = isLightExtensionBinding(values.sourceBinding) ? values.sourceBinding : undefined;
  const hasSourceBinding = Boolean(sourceBinding);

  React.useEffect(() => {
    const subscriptionId = form.subscribe(() => {
      rerender();
    });
    return () => {
      form.unsubscribe(subscriptionId);
    };
  }, [form]);

  React.useEffect(() => {
    if (!values.sourceMode) {
      form.setValuesIn('sourceMode', INLINE_SOURCE_MODE);
      onChange?.(INLINE_SOURCE_MODE);
    }
  }, [form, onChange, values.sourceMode]);

  React.useEffect(() => {
    const errors =
      sourceMode === LIGHT_EXTENSION_SOURCE_MODE
        ? [
            ...(hasSourceBinding ? [] : [String(t('Select a publication'))]),
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
        'You can copy the selected publication code into the inline editor, or keep the existing inline code.',
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
    setSelectedPublication(publication);
    form.setValuesIn('sourceBinding', binding);
    form.setValuesIn('settings', mergeSettings(defaults, values.settings));
  };

  const handleSelectorClear = () => {
    setSelectedPublication(null);
    form.setValuesIn('sourceBinding', undefined);
    form.setValuesIn('settings', {});
    setSettingsValidation({
      value: {},
      errors: [],
    });
  };

  const handleSettingsChange = (nextSettings: Record<string, unknown>, validation: SettingsValidationResult) => {
    form.setValuesIn('settings', nextSettings);
    setSettingsValidation(validation);
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
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <RepoEntryPublicationSelector
            disabled={disabled}
            value={values.sourceBinding}
            onChange={handleSelectorChange}
            onClear={handleSelectorClear}
          />
          {selectedPublication ? (
            <SettingsAutoForm
              schema={selectedPublication.settingsSchemaSnapshot}
              value={values.settings}
              disabled={disabled}
              onChange={handleSettingsChange}
            />
          ) : (
            <Alert type="info" showIcon message={t('Select a publication to configure settings')} />
          )}
          {copying ? <Typography.Text type="secondary">{t('Copying publication code')}</Typography.Text> : null}
        </Space>
      ) : (
        <Button
          disabled={disabled || !sourceBinding}
          loading={copying}
          onClick={copyPublicationToInline}
          style={{ width: 'fit-content' }}
        >
          {t('Copy selected publication code')}
        </Button>
      )}
    </Space>
  );
};

function mergeSettings(
  defaults: Record<string, unknown>,
  current: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return {
    ...defaults,
    ...(isRecord(current) ? current : {}),
  };
}

export default JSBlockLightExtensionSourceField;
