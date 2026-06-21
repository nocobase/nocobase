/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Form, Select, Spin, Switch, Tag, Typography } from 'antd';
import { useForm } from '@formily/react';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../locale';
import { useLLMServiceCatalog } from '../../llm-services/hooks/useLLMServiceCatalog';

const toModelValue = (model: { llmService?: string; model?: string }) =>
  model.llmService && model.model ? `${model.llmService}:${model.model}` : undefined;

const parseModelValue = (value: string) => {
  const [llmService, ...modelParts] = value.split(':');
  return {
    llmService,
    model: modelParts.join(':'),
  };
};

const getModelOptionLabel = ({ serviceTitle, modelLabel }: { serviceTitle: string; modelLabel: string }) =>
  `${serviceTitle} / ${modelLabel}`;

export const ModelSettings: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const { services, loading } = useLLMServiceCatalog();
  const modelSettings = useMemo(() => form.values.modelSettings || {}, [form.values.modelSettings]);
  const enabled = !!modelSettings.enabled;
  const selectedValues = useMemo(() => {
    const models = Array.isArray(modelSettings.models) ? modelSettings.models : [];
    if (models.length) {
      return models.map(toModelValue).filter(Boolean);
    }
    const legacyValue = toModelValue(modelSettings);
    return legacyValue ? [legacyValue] : [];
  }, [modelSettings]);

  const modelOptions = useMemo(() => {
    return services.map((service) => ({
      label: service.llmServiceTitle,
      options: service.enabledModels.map((model) => ({
        label: getModelOptionLabel({
          serviceTitle: service.llmServiceTitle,
          modelLabel: model.label,
        }),
        value: `${service.llmService}:${model.value}`,
      })),
    }));
  }, [services]);

  const modelLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    modelOptions.forEach((group) => {
      group.options.forEach((option) => {
        map.set(option.value, option.label);
      });
    });
    return map;
  }, [modelOptions]);

  const setModelSettings = useCallback(
    (values: Record<string, unknown>) => {
      form.setValuesIn('modelSettings', {
        ...modelSettings,
        ...values,
      });
    },
    [form, modelSettings],
  );

  useEffect(() => {
    if (!enabled || selectedValues.length || !modelOptions.length) {
      return;
    }
    const first = modelOptions[0]?.options?.[0]?.value;
    if (!first) {
      return;
    }
    setModelSettings({ models: [parseModelValue(first)] });
  }, [enabled, modelOptions, selectedValues.length, setModelSettings]);

  return (
    <div>
      <Alert
        type="info"
        showIcon
        message={t('Restrict this AI employee to the selected models.')}
        style={{ marginBottom: 16 }}
      />
      <Form layout="vertical">
        <Form.Item label={<Typography.Text strong>{t('Enable dedicated model configuration')}</Typography.Text>}>
          <Switch checked={enabled} onChange={(checked) => setModelSettings({ enabled: checked })} />
        </Form.Item>
        <Form.Item label={<Typography.Text strong>{t('Models')}</Typography.Text>}>
          <Select
            allowClear={true}
            disabled={!enabled}
            mode="multiple"
            showSearch={true}
            value={selectedValues}
            placeholder={t('Select models')}
            options={modelOptions}
            onChange={(values: string[]) => {
              if (!values?.length) {
                setModelSettings({ llmService: undefined, model: undefined, models: [] });
                return;
              }
              setModelSettings({
                llmService: undefined,
                model: undefined,
                models: values.map(parseModelValue),
              });
            }}
            tagRender={(props) => {
              const { closable, onClose, value } = props;
              return (
                <Tag closable={closable} onClose={onClose} style={{ marginInlineEnd: 4 }}>
                  {modelLabelMap.get(String(value)) || props.label}
                </Tag>
              );
            }}
            loading={loading}
            notFoundContent={loading ? <Spin size="small" /> : null}
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </div>
  );
});
