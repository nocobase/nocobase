/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space>
    <Button disabled type="primary">
      Primary
    </Button>
    <Button disabled>Default</Button>
    <Button disabled type="dashed">
      Dashed
    </Button>
    <br />
    <Button disabled type="text">
      Text
    </Button>
    <Button disabled ghost>
      Ghost
    </Button>
    <Button disabled type="link">
      Link
    </Button>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorTextDisabled', 'colorBgContainerDisabled'],
  key: 'disabled',
};

export default componentDemo;
