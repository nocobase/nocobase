/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Descriptions } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Descriptions title="User Info" bordered>
    <Descriptions.Item label="Product">Cloud Database</Descriptions.Item>
    <Descriptions.Item label="Billing Mode">Prepaid</Descriptions.Item>
    <Descriptions.Item label="Automatic Renewal">YES</Descriptions.Item>
    <Descriptions.Item label="Order time">2018-04-24 18:00:00</Descriptions.Item>
  </Descriptions>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSplit', 'colorText', 'colorFillAlter'],
  key: 'default',
};

export default componentDemo;
