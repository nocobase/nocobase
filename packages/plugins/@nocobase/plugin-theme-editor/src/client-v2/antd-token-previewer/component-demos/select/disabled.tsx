/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Select from './_internal';

import React from 'react';
import type { ComponentDemo } from '../../interface';

import options from './data';

const Demo = () => (
  <Select
    mode="multiple"
    allowClear
    style={{
      width: '100%',
    }}
    disabled
    options={options}
    placeholder="Please select"
    defaultValue={['a10', 'c12']}
  />
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainerDisabled', 'colorTextDisabled'],
  key: 'disabled',
};

export default componentDemo;
