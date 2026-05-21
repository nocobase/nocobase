/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Result } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => <Result status={'info'} title="Demo示意" subTitle="status 为info" />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorInfo'],
  key: 'info',
};

export default componentDemo;
