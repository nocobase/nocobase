/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatePicker, Space } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Space direction="vertical">
    <DatePicker._InternalPanelDoNotUseOrYouWillBeFired picker="week" />
    <DatePicker._InternalPanelDoNotUseOrYouWillBeFired picker="month" />
    <DatePicker._InternalPanelDoNotUseOrYouWillBeFired picker="quarter" />
    <DatePicker._InternalPanelDoNotUseOrYouWillBeFired picker="year" />
  </Space>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: [
    'colorPrimary',
    'colorPrimaryBorder',
    'colorPrimaryHover',
    'controlOutline',
    'colorBgElevated',
    'colorBgContainer',
  ],
  key: 'default',
};

export default componentDemo;
