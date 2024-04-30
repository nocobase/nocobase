/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Typography } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Title } = Typography;

const Demo = () => <Title level={4}>Heading 4</Title>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['fontSizeHeading4'],
  key: 'heading4',
};

export default componentDemo;
