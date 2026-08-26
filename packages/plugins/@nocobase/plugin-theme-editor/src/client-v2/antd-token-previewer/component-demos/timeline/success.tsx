/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Timeline } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <Timeline>
    <Timeline.Item color={'green'}>Create a services site 2015-09-01</Timeline.Item>
    <Timeline.Item color={'green'}>Solve initial network problems 2015-09-01</Timeline.Item>
    <Timeline.Item color={'green'}>Technical testing 2015-09-01</Timeline.Item>
    <Timeline.Item color={'green'}>Network problems being solved 2015-09-01</Timeline.Item>
  </Timeline>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'success',
};

export default componentDemo;
