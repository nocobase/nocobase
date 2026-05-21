/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleFilled } from '@ant-design/icons';
import { Input, theme } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

function onChange() {}

const Demo = () => {
  const { token } = theme.useToken();
  return (
    <Input
      defaultValue={"I'm the content"}
      suffix={<CheckCircleFilled style={{ color: token.colorSuccess }} />}
      onChange={onChange}
    />
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'warning',
};

export default componentDemo;
