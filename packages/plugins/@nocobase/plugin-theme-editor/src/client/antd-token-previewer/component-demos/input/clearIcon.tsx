/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => <Input placeholder="Basic usage" value={'右侧的图标就是 colorIcon'} allowClear />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorIcon', 'colorIconHover'],
  key: 'clearIcon',
};
export default componentDemo;
