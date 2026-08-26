/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Steps } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Step } = Steps;

const Demo: React.FC = () => (
  <Steps current={1}>
    <Step title="Error" status={'error'} description="This is a description." />
    <Step status={'error'} title="In Progress" subTitle="Left 00:00:08" description="This is a description." />
  </Steps>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError'],
  key: 'danger',
};

export default componentDemo;
