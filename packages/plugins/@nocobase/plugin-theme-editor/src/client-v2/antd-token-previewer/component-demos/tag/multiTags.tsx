/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { CheckableTag } = Tag;

const Checkable = () => (
  <div>
    <CheckableTag checked>Error</CheckableTag>
    <CheckableTag checked={false}>Error</CheckableTag>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Checkable />,
  tokens: ['colorPrimary', 'colorPrimaryHover', 'colorPrimaryActive'],
  key: 'multiTags',
};

export default componentDemo;
