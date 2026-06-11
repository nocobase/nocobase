/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';
import { namespace, useT } from '../../locale';
import { useChatBoxStore } from './stores/chat-box';

export const HintMessageHeader: React.FC = () => {
  const t = useT();
  const { token } = useToken();

  return (
    <Alert
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
        color: token.colorText,
      }}
      icon={<InfoCircleOutlined style={{ color: token.colorText }} />}
      message={t('Please enter and send the modification request', { ns: namespace })}
      type="info"
      showIcon
    />
  );
};
