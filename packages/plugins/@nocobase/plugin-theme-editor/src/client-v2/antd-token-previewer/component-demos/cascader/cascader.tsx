/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cascader } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';
import options from './data';
const { _InternalPanelDoNotUseOrYouWillBeFired: InternalCascader } = Cascader;

const Demo = (props: any) => <InternalCascader options={options} {...props} open placeholder="Please select" />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgContainer', 'colorPrimary'],
  key: 'default',
};

export default componentDemo;
