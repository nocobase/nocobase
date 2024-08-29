/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockRefreshButton } from '../initializers/BlockRefreshAction';
import { SchemaComponentOptions } from '@nocobase/client';
import { GlobalAutoRefreshProvider } from './GlobalAutoRefreshProvider';

export const ChartBlockProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        BlockRefreshButton,
      }}
    >
      <GlobalAutoRefreshProvider> {props.children}</GlobalAutoRefreshProvider>
    </SchemaComponentOptions>
  );
};
