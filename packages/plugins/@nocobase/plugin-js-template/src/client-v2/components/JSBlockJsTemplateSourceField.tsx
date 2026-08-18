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
import { Alert, Button, Select, Space, Typography } from 'antd';
import React from 'react';
import {
  extractRunJSSettingsDefaults,
  normalizeJsTemplateSelection,
  normalizeJsTemplateSettings,
} from '@nocobase/runjs/settings';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import {
  createJsTemplateRuntimeSourceBinding,
  isJsTemplateRuntimeSourceBinding,
} from '../../shared/jsTemplateSourceBinding';
import type {
  JsTemplateKind,
  JsTemplateRuntimeSourceBinding,
  JsTemplateSelectableTemplateSummary,
} from '../../shared/types';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { listSelectableJsTemplates } from '../api/jsTemplatesRequests';

const INLINE_SOURCE_MODE = 'inline';
const JS_TEMPLATE_SOURCE_MODE = 'js-template';
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
  sourceMode?: string;
  sourceBinding?: JsTemplateRuntimeSourceBinding;
  settings?: Record<string, unknown>;
};

type SourceSelectOption = {
  label: string;
  value: string;
  searchText: string;
};

function serializeSourceFormValues(values: JSBlockRunJSFormValues): string {
  return JSON.stringify({
    sourceMode: values.sourceMode,
    sourceBinding: values.sourceBinding,
    settings: values.settings,
  });
}

export interface JSBlockJsTemplateSourceFieldProps {
  value?: string | JsTemplateRuntimeSourceBinding | null;
  onChange?: (value: string | JsTemplateRuntimeSourceBinding | undefined) => void;
  disabled?: boolean;
  kind?: JsTemplateKind;
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

function setFieldErrors(field: Field, errors: string[]) {
  const target = field as Field & {
    setSelfErrors?: (messages: string[] | string) => void;
    selfErrors?: string[];
  };
  const currentErrors = Array.isArray(target.selfErrors) ? target.selfErrors : [];
  if (currentErrors.length === errors.length && currentErrors.every((message, index) => message === errors[index])) {
    return;
  }
  if (typeof target.setSelfErrors === 'function') {
    target.setSelfErrors(errors);
    return;
  }
  target.selfErrors = errors;
}

function getFieldPath(field: Field): string {
  return field.path?.toString() || '';
}

function getTemplateSelectValue(template: Pick<JsTemplateSelectableTemplateSummary, 'id' | 'projectId'>): string {
  return `${JS_TEMPLATE_SOURCE_MODE}:${template.projectId}:${template.id}`;
}

function getBindingSelectValue(binding: Pick<JsTemplateRuntimeSourceBinding, 'templateId' | 'projectId'>): string {
  return `${JS_TEMPLATE_SOURCE_MODE}:${binding.projectId}:${binding.templateId}`;
}

function getBindingLabel(binding: JsTemplateRuntimeSourceBinding): string {
  return binding.templateId;
}

function getBindingDisplayLabel(
  binding: JsTemplateRuntimeSourceBinding,
  template: JsTemplateSelectableTemplateSummary | null,
  sourceLabel: string,
): string {
  const projectLabel = template ? getJsTemplateProjectLabel(template) : binding.projectId;
  const templateLabel = template ? getJsTemplateLabel(template) : getBindingLabel(binding);
  const bindingLabel =
    projectLabel && templateLabel !== projectLabel ? `${projectLabel} / ${templateLabel}` : templateLabel;
  return `${sourceLabel} / ${bindingLabel}`;
}

export const JSBlockJsTemplateSourceField: React.FC<JSBlockJsTemplateSourceFieldProps> = ({
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
  const formSignatureRef = React.useRef(serializeSourceFormValues(form.values as JSBlockRunJSFormValues));
  const [sourceTemplates, setSourceTemplates] = React.useState<JsTemplateSelectableTemplateSummary[]>([]);
  const [sourceTemplatesLoading, setSourceTemplatesLoading] = React.useState(false);
  const [sourceTemplatesError, setSourceTemplatesError] = React.useState<string | null>(null);
  const descriptionId = React.useId();

  const values = form.values as JSBlockRunJSFormValues;
  const rendersSourceModeControl = typeof value === 'string' || getFieldPath(field) === 'sourceMode';
  const sourceMode =
    (rendersSourceModeControl && typeof value === 'string' ? value : values.sourceMode) || INLINE_SOURCE_MODE;
  const sourceBindingFromValue = isJsTemplateRuntimeSourceBinding(value) && value.kind === kind ? value : undefined;
  const sourceBinding =
    sourceBindingFromValue ||
    (isJsTemplateRuntimeSourceBinding(values.sourceBinding) && values.sourceBinding.kind === kind
      ? values.sourceBinding
      : undefined);
  const hasSourceBinding = Boolean(sourceBinding);
  const selectedTemplate = React.useMemo(
    () =>
      sourceBinding
        ? sourceTemplates.find(
            (template) =>
              template.projectId === sourceBinding.projectId &&
              template.id === sourceBinding.templateId &&
              template.kind === sourceBinding.kind,
          ) || null
        : null,
    [sourceBinding, sourceTemplates],
  );
  const hasSettings = Boolean(
    selectedTemplate && getSettingsSchemaPropertyNames(selectedTemplate.settingsSchema)?.size,
  );
  const settingsStatus = React.useMemo(() => {
    if (!selectedTemplate || !isRecord(selectedTemplate.settingsSchema) || !hasSettings) {
      return { kind: 'none' as const, missingCount: 0 };
    }
    const validation = validateRunJSSettings({
      schema: selectedTemplate.settingsSchema,
      settings: normalizeJsTemplateSettings(
        {
          schema: selectedTemplate.settingsSchema,
          defaults: extractRunJSSettingsDefaults(selectedTemplate.settingsSchema),
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
  }, [hasSettings, selectedTemplate, values.settings]);

  React.useEffect(() => {
    if (sourceMode !== JS_TEMPLATE_SOURCE_MODE || typeof ctx?.view?.setFooter !== 'function') {
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
      const nextSignature = serializeSourceFormValues(form.values as JSBlockRunJSFormValues);
      if (nextSignature === formSignatureRef.current) {
        return;
      }
      formSignatureRef.current = nextSignature;
      rerender();
    });
    return () => {
      form.unsubscribe(subscriptionId);
    };
  }, [form]);

  React.useEffect(() => {
    if (!rendersSourceModeControl && sourceMode !== JS_TEMPLATE_SOURCE_MODE) {
      return;
    }
    if (!api) {
      setSourceTemplates([]);
      setSourceTemplatesLoading(false);
      setSourceTemplatesError(null);
      return;
    }

    let mounted = true;
    setSourceTemplatesLoading(true);
    setSourceTemplatesError(null);
    const loadSourceTemplates = async () => {
      try {
        const templates = await listSelectableJsTemplates(api, { kind });
        if (!mounted) {
          return;
        }
        setSourceTemplates(
          templates.filter((template) => template.kind === kind && template.runtimeAvailable === true),
        );
      } catch {
        if (!mounted) {
          return;
        }
        setSourceTemplates([]);
        setSourceTemplatesError(t('Failed to load templates'));
      } finally {
        if (mounted) {
          setSourceTemplatesLoading(false);
        }
      }
    };
    loadSourceTemplates();
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
      sourceMode === JS_TEMPLATE_SOURCE_MODE && !hasSourceBinding ? [String(t('Select a JS Template'))] : [],
    );
  }, [field, hasSourceBinding, sourceMode, t]);

  const setSourceMode = (nextMode: string) => {
    form.setValuesIn('sourceMode', nextMode);
    onChange?.(nextMode);
  };

  const handleSourceTemplateSelect = (template: JsTemplateSelectableTemplateSummary) => {
    const nextBinding = createJsTemplateRuntimeSourceBinding({
      projectId: template.projectId,
      templateId: template.id,
      kind: template.kind,
    });
    const defaults = extractRunJSSettingsDefaults(template.settingsSchema);
    form.setValuesIn('sourceMode', JS_TEMPLATE_SOURCE_MODE);
    form.setValuesIn('sourceBinding', nextBinding);
    form.setValuesIn(
      'settings',
      normalizeJsTemplateSelection({
        currentBinding: sourceBinding,
        currentSettings: values.settings,
        nextBinding,
        descriptor: {
          entryId: template.id,
          settingsSchemaHash: template.settingsSchemaHash,
          schema: template.settingsSchema,
          defaults,
        },
      }),
    );
    onChange?.(rendersSourceModeControl ? JS_TEMPLATE_SOURCE_MODE : nextBinding);
  };

  const handleSourceSelectChange = (nextValue: string) => {
    if (nextValue === INLINE_SOURCE_SELECT_VALUE) {
      setSourceMode(INLINE_SOURCE_MODE);
      return;
    }

    const template = sourceTemplates.find((item) => getTemplateSelectValue(item) === nextValue);
    if (!template) {
      return;
    }
    handleSourceTemplateSelect(template);
  };

  const sourceSelectValue =
    sourceMode === JS_TEMPLATE_SOURCE_MODE && sourceBinding
      ? getBindingSelectValue(sourceBinding)
      : sourceMode === JS_TEMPLATE_SOURCE_MODE
        ? undefined
        : INLINE_SOURCE_SELECT_VALUE;
  const sourceSelectOptions = React.useMemo<SourceSelectOption[]>(() => {
    const options: SourceSelectOption[] = [
      ...(sourceMode === JS_TEMPLATE_SOURCE_MODE && sourceBinding
        ? []
        : [
            {
              label: t('Inline code'),
              value: INLINE_SOURCE_SELECT_VALUE,
              searchText: t('Inline code'),
            },
          ]),
      ...sourceTemplates.map((template) => {
        const label = getJsTemplateLabel(template);
        return {
          label,
          value: getTemplateSelectValue(template),
          searchText: [label, template.templateName, template.entryPath, template.projectId, t('JS Template')]
            .filter(Boolean)
            .join(' '),
        };
      }),
    ];
    if (
      sourceMode === JS_TEMPLATE_SOURCE_MODE &&
      sourceBinding &&
      !options.some((option) => option.value === getBindingSelectValue(sourceBinding))
    ) {
      const label = getBindingLabel(sourceBinding);
      options.push({
        label,
        value: getBindingSelectValue(sourceBinding),
        searchText: [label, sourceBinding.templateId, sourceBinding.projectId, t('JS Template')]
          .filter(Boolean)
          .join(' '),
      });
    }
    return options;
  }, [sourceBinding, sourceTemplates, sourceMode, t]);

  const jsTemplateBinding = (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {sourceBinding ? (
        <Typography.Text strong>
          {getBindingDisplayLabel(sourceBinding, selectedTemplate, t('JS Template'))}
        </Typography.Text>
      ) : null}
      {sourceBinding && selectedTemplate ? (
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
          type={sourceTemplatesLoading ? 'info' : 'warning'}
          showIcon
          message={sourceTemplatesLoading ? t('Loading JS Template') : t('Selected JS Template is unavailable')}
        />
      ) : (
        <Alert type="info" showIcon message={t('Select a JS Template to configure settings')} />
      )}
    </Space>
  );

  if (!rendersSourceModeControl) {
    if (sourceMode !== JS_TEMPLATE_SOURCE_MODE) {
      return null;
    }
    return (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Select
          aria-label={t('Code source')}
          aria-describedby={descriptionId}
          disabled={disabled}
          loading={sourceTemplatesLoading}
          value={sourceSelectValue}
          showSearch
          optionFilterProp="searchText"
          options={sourceSelectOptions.filter((option) => option.value !== INLINE_SOURCE_SELECT_VALUE)}
          onChange={handleSourceSelectChange}
          notFoundContent={t('No JS Templates')}
          placeholder={t('Select a JS Template')}
        />
        <div id={descriptionId}>
          {sourceTemplatesError ? <Alert type="error" showIcon message={sourceTemplatesError} /> : null}
          {jsTemplateBinding}
        </div>
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Select
        aria-label={t('Code source')}
        aria-describedby={descriptionId}
        disabled={disabled}
        loading={sourceTemplatesLoading}
        value={sourceSelectValue}
        showSearch
        optionFilterProp="searchText"
        options={sourceSelectOptions}
        onChange={handleSourceSelectChange}
        notFoundContent={t('No JS Templates')}
        placeholder={t('Select a JS Template')}
      />
      <div id={descriptionId}>
        {sourceTemplatesError ? <Alert type="error" showIcon message={sourceTemplatesError} /> : null}
        {sourceMode === JS_TEMPLATE_SOURCE_MODE ? jsTemplateBinding : null}
      </div>
    </Space>
  );
};

export const JSFieldJsTemplateSourceField: React.FC<Omit<JSBlockJsTemplateSourceFieldProps, 'kind'>> = (props) => (
  <JSBlockJsTemplateSourceField {...props} kind="js-field" />
);

export const JSActionJsTemplateSourceField: React.FC<Omit<JSBlockJsTemplateSourceFieldProps, 'kind'>> = (props) => (
  <JSBlockJsTemplateSourceField {...props} kind="js-action" />
);

export const JSItemJsTemplateSourceField: React.FC<Omit<JSBlockJsTemplateSourceFieldProps, 'kind'>> = (props) => (
  <JSBlockJsTemplateSourceField {...props} kind="js-item" />
);

function getJsTemplateLabel(template: JsTemplateSelectableTemplateSummary): string {
  return template.templateName || template.id;
}

function getJsTemplateProjectLabel(template: JsTemplateSelectableTemplateSummary): string {
  return template.projectTitle?.trim() || template.projectName?.trim() || template.projectId;
}

export default JSBlockJsTemplateSourceField;
