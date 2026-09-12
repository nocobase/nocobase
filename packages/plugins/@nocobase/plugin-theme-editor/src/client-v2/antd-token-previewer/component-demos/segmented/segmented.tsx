/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Segmented } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => <Segmented options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  key: 'default',
  tokens: [],
};

export default componentDemo;
