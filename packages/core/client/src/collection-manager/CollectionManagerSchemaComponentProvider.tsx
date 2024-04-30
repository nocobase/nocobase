/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponentOptions } from '..';
import { CollectionProvider_deprecated, ResourceActionProvider, useDataSourceFromRAC } from '.';
import * as hooks from './action-hooks';
import { DataSourceProvider_deprecated, ds, SubFieldDataSourceProvider_deprecated } from './sub-table';

export const CollectionManagerSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{ cm: { ...hooks, useDataSourceFromRAC }, ds }}
      components={{
        SubFieldDataSourceProvider_deprecated,
        DataSourceProvider_deprecated,
        CollectionProvider_deprecated,
        ResourceActionProvider,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
