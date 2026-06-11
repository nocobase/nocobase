/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Progress, theme } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <div style={{ padding: 24, background: token.colorBgLayout }}>
      <Progress percent={30} />
      <Progress percent={50} status="active" />
      <Progress percent={70} status="exception" />
      <Progress percent={100} />
      <Progress percent={50} showInfo={false} />
      <Progress steps={8} />
    </div>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorFillSecondary', 'colorText', 'colorBgContainer'],
  key: 'layout',
};

export default componentDemo;
