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
import { Alert, Button, Divider, App, Tooltip } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { getRecommendedModels } from '../recommended-models';
import { useT } from '../../locale';

export const LLMTestFlight: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const api = useAPIClient();
  const { message } = App.useApp();
  const [failureMessage, setFailureMessage] = useState('');
  const [successful, setSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    const { provider, options, enabledModels } = form.values;

    // Check if API Key is filled
    if (!options?.apiKey) {
      message.warning(t('Please fill in the API Key first'));
      return;
    }

    // Determine which model to use
    let model: string;
    if (!enabledModels || enabledModels.length === 0) {
      // Auto Mode: use first recommended model
      const recommended = getRecommendedModels(provider);
      if (recommended.length === 0) {
        message.warning(t('No recommended models available for this provider'));
        return;
      }
      model = recommended[0];
    } else {
      // Custom Mode: use first enabled model
      model = enabledModels[0];
    }

    setSuccessful(false);
    setFailureMessage('');
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
        setFailureMessage(res.data.data.message);
      } else {
        setSuccessful(true);
      }
    } catch (error: any) {
      setFailureMessage(error.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Divider style={{ borderColor: '#f0f0f0', marginTop: 30, marginBottom: 30 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{t('Test flight')}</span>
        <Tooltip title={t('Test connection with the configured API Key')}>
          <Button type="primary" shape="circle" icon={<RocketOutlined />} loading={loading} onClick={handleTest} />
        </Tooltip>
      </div>
      {successful && (
        <div style={{ marginTop: 16 }}>
          <Alert message={t('Successful')} type="success" closable onClose={() => setSuccessful(false)} />
        </div>
      )}
      {failureMessage && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message={t('Failure')}
            description={failureMessage}
            type="warning"
            closable
            onClose={() => setFailureMessage('')}
          />
        </div>
      )}
    </div>
  );
});
