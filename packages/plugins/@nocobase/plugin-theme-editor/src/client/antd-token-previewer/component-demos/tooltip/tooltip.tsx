/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tooltip } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <div>
    <Tooltip._InternalPanelDoNotUseOrYouWillBeFired title="prompt text" />
    <span>Tooltip will show on mouse enter.</span>
  </div>
);
const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgSpotlight', 'colorTextLightSolid'],
  key: 'default',
};

export default componentDemo;
