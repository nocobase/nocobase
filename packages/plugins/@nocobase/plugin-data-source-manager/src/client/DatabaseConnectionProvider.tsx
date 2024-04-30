/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentOptions } from '@nocobase/client';
import React, { FC, useState, createContext } from 'react';
import * as hooks from './hooks';

export const DataSourceContext = createContext(null);
DataSourceContext.displayName = 'DataSourceContext';

export const DatabaseConnectionProvider: FC = (props) => {
  const [dataSource, setDataSource] = useState(null);
  return (
    <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
      <SchemaComponentOptions scope={hooks} components={{}}>
        {props.children}
      </SchemaComponentOptions>
    </DataSourceContext.Provider>
  );
};
