/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FC } from 'react';
import React from 'react';
import { antdComponents } from './component-panel';
import type { Theme } from './interface';
import ComponentDemoPro from './token-panel-pro/ComponentDemoPro';

export type PreviewDemoProps = {
  theme: Theme;
  style?: React.CSSProperties;
};

const PreviewDemo: FC<PreviewDemoProps> = ({ theme, style }) => {
  return (
    <div style={{ ...style, overflow: 'auto' }}>
      <ComponentDemoPro
        theme={theme}
        components={antdComponents}
        componentDrawer={false}
        showAll
        style={{ minHeight: '100%' }}
      />
    </div>
  );
};

export default PreviewDemo;
