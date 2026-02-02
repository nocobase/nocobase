/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useAPIClient, useApp, useRequest } from '@nocobase/client';
import { useT } from '../../locale';

const { Text, Paragraph } = Typography;

export const LLMConfigurationGuide: React.FC = () => {
  const t = useT();
  const api = useAPIClient();
  const app = useApp();

  const { data, loading } = useRequest<{ configured: boolean }>(() =>
    api
      .resource('ai')
      .checkLLMConfigured()
      .then((res) => res?.data?.data),
  );

  if (loading || data?.configured) {
    return null;
  }

  return (
    <Modal open title={t('Configure LLM Service')} footer={null} closable={false} maskClosable={false} width={480}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Paragraph>
          <Text>
            {t('You have not configured any LLM service yet. Please configure one to start using AI employees.')}
          </Text>
        </Paragraph>
        <Paragraph type="secondary">
          <Text type="secondary">
            {t(
              'LLM services are required for AI employees to function. You can configure providers like OpenAI, Anthropic Claude, Google Gemini, and more.',
            )}
          </Text>
        </Paragraph>
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => app.router.navigate('/admin/settings/ai/llm-services', { state: { autoOpenAddNew: true } })}
          >
            {t('Start configuration')}
          </Button>
        </div>
      </Space>
    </Modal>
  );
};
