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
import { Select, Spin, Switch, Space, Tag, Typography } from 'antd';
import { Field } from '@formily/core';
import { useT } from '../../locale';
import { isRecommendedModel } from '../recommended-models';

const { Text } = Typography;

export const EnabledModelsSelect: React.FC<any> = observer((props) => {
  const api = useAPIClient();
  const t = useT();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const field = useField<Field>();
  const form = useForm();

  const provider = form.values.provider;
  const formOptions = form.values.options;
  const autoMode = mode === 'auto';

  // Access deep properties to establish observer tracking
  const optionsKey = JSON.stringify(formOptions);

  // Initialize mode from form value - empty or no enabledModels means auto mode
  useEffect(() => {
    const enabledModels = form.values.enabledModels;
    const isEmpty = !enabledModels || (Array.isArray(enabledModels) && enabledModels.length === 0);
    const initialMode = isEmpty ? 'auto' : 'custom';
    setMode(initialMode);
    form.setValuesIn('useRecommended', initialMode === 'auto');
  }, []);

  // Fetch models when provider, options, or mode change
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
            label: id,
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
  }, [provider, optionsKey, mode]);

  const handleAutoModeChange = (checked: boolean) => {
    const newMode = checked ? 'auto' : 'custom';
    setMode(newMode);
    form.setValuesIn('useRecommended', checked);
    if (checked) {
      field.value = [];
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <span>{t('Auto Mode')}</span>
        <Switch checked={autoMode} onChange={handleAutoModeChange} size="small" />
      </Space>
      {autoMode ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('Use system recommended models for best results')}
        </Text>
      ) : (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('Select the models allowed to use')}
          </Text>
          <Select
            {...props}
            mode="multiple"
            options={options}
            loading={loading}
            notFoundContent={loading ? <Spin size="small" /> : undefined}
            value={field.value || []}
            onChange={(val) => (field.value = val)}
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
        </>
      )}
    </Space>
  );
});
