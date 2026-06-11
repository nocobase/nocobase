/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space>
    <Card title="Default size card" extra={<a href="#">More</a>} style={{ width: 300 }}>
      <p>Card content</p> <p>Card content</p> <p>Card content</p>
    </Card>
    <Card loading size="small" title="Small size card" extra={<a href="#">More</a>} style={{ width: 300 }}>
      <p>Card content</p> <p>Card content</p> <p>Card content</p>
    </Card>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: [
    'colorText',
    'colorTextHeading',
    'colorTextSecondary',
    'colorBgContainer',
    'colorBorderSecondary',
    'colorPrimary',
    'colorBgContainer',
  ],
  key: 'card',
};

export default componentDemo;
