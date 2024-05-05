/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Pagination } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo: React.FC = () => <Pagination showQuickJumper defaultCurrent={2} total={10} disabled />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['controlItemBgActiveDisabled', 'colorBgContainerDisabled', 'colorFillAlter'],
  key: 'disabled',
};

export default componentDemo;
