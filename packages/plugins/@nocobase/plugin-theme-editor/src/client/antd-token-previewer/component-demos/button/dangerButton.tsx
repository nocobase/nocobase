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
    <Button type="primary" danger>
      primary
    </Button>
    <Button type="default" danger>
      default
    </Button>
    <Button type="text" danger>
      text
    </Button>
    {/*<Button ghost danger>*/}
    {/*  ghost*/}
    {/*</Button>*/}
    <Button type="link" danger>
      link
    </Button>
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorActive', 'colorErrorHover', 'colorErrorBorder', 'colorErrorOutline'],
  key: 'danger',
};

export default componentDemo;
