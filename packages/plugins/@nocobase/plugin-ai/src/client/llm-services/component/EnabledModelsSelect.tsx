/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { useAPIClient } from '@nocobase/client';
import { useForm, useField, observer } from '@formily/react';
import { Select, Spin, Radio, Space, Tag, Typography, Input, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Field } from '@formily/core';
import { useT } from '../../locale';
import { isRecommendedModel } from '../../../common/recommended-models';

const { Text } = Typography;

export interface EnabledModelsConfig {
  mode: 'recommended' | 'provider' | 'custom';
  models: Array<{ label: string; value: string }>;
}

/**
 * Format a model ID into a human-readable label (client-only).
 * 1. Strip prefixes: `models/`, `ft:`, `accounts/.../models/`
 * 2. Split on `-` and `_`
 * 3. Capitalize first letter of each segment
 * 4. Rejoin with `-`
 */
export const formatModelLabel = (id: string): string => {
  let name = id;
  // Strip known prefixes
  name = name.replace(/^models\//, '');
  name = name.replace(/^ft:/, '');
  name = name.replace(/^accounts\/[^/]+\/models\//, '');
  // Split on - and _
  const segments = name.split(/[-_]/);
  // Capitalize first letter of each segment
  const capitalized = segments.map((s) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s));
  return capitalized.join('-');
};

/**
 * Normalize old `string[]` format to new `EnabledModelsConfig`.
 * Also handles null/undefined gracefully.
 */
export const normalizeEnabledModels = (value: unknown): EnabledModelsConfig => {
  if (!value) {
    return { mode: 'recommended', models: [] };
  }
  // Already new format
  if (typeof value === 'object' && !Array.isArray(value) && (value as EnabledModelsConfig).mode) {
    return value as EnabledModelsConfig;
  }
  // Old string[] format
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { mode: 'recommended', models: [] };
    }
    return {
      mode: 'custom',
      models: value.map((id: string) => ({ label: id, value: id })),
    };
  }
  return { mode: 'recommended', models: [] };
};

export const EnabledModelsSelect: React.FC<any> = observer((props) => {
  const api = useAPIClient();
  const t = useT();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const field = useField<Field>();
  const form = useForm();

  const provider = form.values.provider;
  const formOptions = form.values.options;

  // Access deep properties to establish observer tracking
  const optionsKey = JSON.stringify(formOptions);

  // Derive current config from field value
  const config = normalizeEnabledModels(field.value);

  // Initialize field value on mount if it's an old format
  useEffect(() => {
    const normalized = normalizeEnabledModels(field.value);
    if (field.value !== normalized && (Array.isArray(field.value) || !field.value)) {
      field.value = normalized;
    }
  }, []);

  // Fetch models when provider or options change (needed for provider mode)
  useEffect(() => {
    if (!provider) {
      setOptions([]);
      return;
    }

    const fetchModels = async () => {
      try {
        setLoading(true);
        const res = await api
          .resource('ai')
          .listProviderModels({ values: { provider, options: formOptions } }, { skipNotify: true });
        const items =
          res?.data?.data?.map(({ id }: { id: string }) => ({
            label: formatModelLabel(id),
            value: id,
          })) || [];

        // Sort: recommended models first
        const sortedItems = items.sort((a: { value: string }, b: { value: string }) => {
          const aRecommended = isRecommendedModel(provider, a.value);
          const bRecommended = isRecommendedModel(provider, b.value);
          if (aRecommended && !bRecommended) return -1;
          if (!aRecommended && bRecommended) return 1;
          return 0;
        });

        setOptions(sortedItems);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [provider, optionsKey]);

  const updateFieldValue = (newConfig: EnabledModelsConfig) => {
    field.value = { ...newConfig };
  };

  const handleModeChange = (newMode: 'recommended' | 'provider' | 'custom') => {
    updateFieldValue({ mode: newMode, models: [] });
  };

  const handleProviderModelsChange = (selectedValues: string[]) => {
    const models = selectedValues.map((val) => {
      // Find label from options
      const opt = options.find((o) => o.value === val);
      return { label: opt ? opt.label : formatModelLabel(val), value: val };
    });
    updateFieldValue({ mode: 'provider', models });
  };

  const handleCustomModelChange = (index: number, key: 'label' | 'value', val: string) => {
    const newModels = [...config.models];
    newModels[index] = { ...newModels[index], [key]: val };
    updateFieldValue({ mode: 'custom', models: newModels });
  };

  const handleAddCustomModel = () => {
    updateFieldValue({ mode: 'custom', models: [...config.models, { label: '', value: '' }] });
  };

  const handleRemoveCustomModel = (index: number) => {
    const newModels = config.models.filter((_, i) => i !== index);
    updateFieldValue({ mode: 'custom', models: newModels });
  };

  return (
    <div style={{ width: '100%' }}>
      <Radio.Group value={config.mode} onChange={(e) => handleModeChange(e.target.value)} style={{ width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Radio value="recommended">{t('System recommended')}</Radio>
          {config.mode === 'recommended' && (
            <Text type="secondary" style={{ fontSize: 12, paddingLeft: 24 }}>
              {t('Automatically use the best models selected by the system')}
            </Text>
          )}

          <Radio value="provider">{t('Select provider model')}</Radio>
          {config.mode === 'provider' && (
            <div style={{ paddingLeft: 24 }}>
              <Select
                mode="multiple"
                options={options}
                loading={loading}
                notFoundContent={loading ? <Spin size="small" /> : undefined}
                value={config.models.map((m) => m.value)}
                onChange={handleProviderModelsChange}
                placeholder={t('Select models to enable')}
                style={{ width: '100%' }}
                optionRender={(option) => {
                  const recommended = isRecommendedModel(provider, option.value as string);
                  return (
                    <Space>
                      <span>{option.label}</span>
                      {recommended && (
                        <Tag color="blue" style={{ marginLeft: 4 }}>
                          {t('Recommended')}
                        </Tag>
                      )}
                    </Space>
                  );
                }}
              />
            </div>
          )}

          <Radio value="custom">{t('Custom model input')}</Radio>
          {config.mode === 'custom' && (
            <div style={{ paddingLeft: 24 }}>
              {config.models.map((model, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Input
                    placeholder={t('Model id')}
                    value={model.value}
                    onChange={(e) => handleCustomModelChange(index, 'value', e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Input
                    placeholder={t('Display name')}
                    value={model.label}
                    onChange={(e) => handleCustomModelChange(index, 'label', e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Button type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveCustomModel(index)} />
                </Space>
              ))}
              <Button type="dashed" onClick={handleAddCustomModel} icon={<PlusOutlined />} style={{ width: '100%' }}>
                {t('Add model')}
              </Button>
            </div>
          )}
        </Space>
      </Radio.Group>
    </div>
  );
});
