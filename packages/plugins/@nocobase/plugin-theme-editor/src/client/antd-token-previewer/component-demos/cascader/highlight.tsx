/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cascader as _Cascader } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

import options from './data';

const { _InternalPanelDoNotUseOrYouWillBeFired: Cascader } = _Cascader;

const Demo = () => {
  return <Cascader options={options} placeholder="Please select" searchValue={'jiang'} showSearch />;
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorHighlight'],
  key: 'highlight',
};

export default componentDemo;
