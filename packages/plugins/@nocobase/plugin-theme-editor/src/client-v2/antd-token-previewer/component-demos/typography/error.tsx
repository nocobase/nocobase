/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Typography } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Title, Text } = Typography;

const Demo = () => (
  <div>
    <Title type={'danger'} level={4}>
      Error Title
    </Title>
    <Text type={'danger'}>error Text</Text>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorHover', 'colorErrorActive'],
  key: 'error',
};

export default componentDemo;
