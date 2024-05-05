/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import React from 'react';

import menu from './menu';

import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <div>
    <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
      Hover me <DownOutlined />
    </a>
    <Dropdown._InternalPanelDoNotUseOrYouWillBeFired overlay={menu} />
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorError', 'colorErrorHover', 'colorBgElevated'],
  key: 'default',
};

export default componentDemo;
