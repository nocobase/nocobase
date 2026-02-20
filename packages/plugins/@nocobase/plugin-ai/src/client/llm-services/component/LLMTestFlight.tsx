/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm, observer } from '@formily/react';
import { useAPIClient } from '@nocobase/client';
import React, { useState } from 'react';
import { Button, App, Tooltip } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { getRecommendedModels } from '../../../common/recommended-models';
import { normalizeEnabledModels } from './EnabledModelsSelect';
import { useT } from '../../locale';

export const LLMTestFlight: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const api = useAPIClient();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    const { provider, options, enabledModels } = form.values;

    // Check if API Key is filled
    if (!options?.apiKey) {
      message.warning(t('Please fill in the API Key first'));
      return;
    }

    // Determine which model to use
    const config = normalizeEnabledModels(enabledModels);
    let model: string;
    if (config.mode === 'recommended') {
      const recommended = getRecommendedModels(provider);
      if (recommended.length === 0) {
        message.warning(t('Please configure enabled models first'));
        return;
      }
      model = recommended[0].value;
    } else {
      // provider or custom mode
      if (config.models.length === 0) {
        message.warning(t('Please configure enabled models first'));
        return;
      }
      model = config.models[0].value;
    }

    setLoading(true);

    try {
      const res = await api.resource('ai').testFlight({
        values: {
          provider,
          options,
          model,
        },
      });
      if (res.data.data.code !== 0) {
        message.error(res.data.data.message || t('Failure'));
      } else {
        message.success(t('Successful'));
      }
    } catch (error: any) {
      message.error(error.message || t('Failure'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={t('Test connection with the configured API Key')}>
      <Button icon={<RocketOutlined />} loading={loading} onClick={handleTest}>
        {t('Test flight')}
      </Button>
    </Tooltip>
  );
});
