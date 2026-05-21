/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space direction={'vertical'}>
    <Alert message="Informational Notes" type="info" showIcon />
    <Alert
      message="Informational Notes"
      description="Additional description and information about copywriting."
      type="info"
      showIcon
    />
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorInfo', 'colorInfoBorder', 'colorInfoBg'],
  key: 'info',
};

export default componentDemo;
