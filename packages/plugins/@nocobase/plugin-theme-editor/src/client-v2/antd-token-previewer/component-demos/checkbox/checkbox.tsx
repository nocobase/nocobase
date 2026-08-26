/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = (props: any) => (
  <Space>
    <Checkbox {...props}>Checkbox</Checkbox>
    <Checkbox {...props} checked>
      选中态
    </Checkbox>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorText', 'colorBgContainer'],
  key: 'default',
};

export default componentDemo;
