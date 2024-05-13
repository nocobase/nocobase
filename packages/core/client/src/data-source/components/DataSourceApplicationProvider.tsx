/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import type { DataSourceManager } from '../data-source/DataSourceManager';
import { DataSourceManagerProvider } from '../data-source/DataSourceManagerProvider';
import {
  type CollectionManagerProviderProps,
  CollectionManagerProvider,
} from '../collection/CollectionManagerProvider';

interface DataSourceApplicationProviderProps extends CollectionManagerProviderProps {
  dataSourceManager: DataSourceManager;
}

/**
 * @internal
 */
export const DataSourceApplicationProvider: FC<DataSourceApplicationProviderProps> = ({
  children,
  dataSourceManager,
  ...otherProps
}) => {
  return (
    <DataSourceManagerProvider dataSourceManager={dataSourceManager}>
      <CollectionManagerProvider {...otherProps}>{children}</CollectionManagerProvider>
    </DataSourceManagerProvider>
  );
};
