/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { SchemaComponentOptions } from '..';
import { CollectionProvider_deprecated } from './CollectionProvider_deprecated';
import { ResourceActionProvider, useDataSourceFromRAC } from './ResourceActionProvider';
import * as hooks from './action-hooks';
import { DataSourceProvider_deprecated, SubFieldDataSourceProvider_deprecated, ds } from './sub-table';

const components = {
  SubFieldDataSourceProvider_deprecated,
  DataSourceProvider_deprecated,
  CollectionProvider_deprecated,
  ResourceActionProvider,
};

export const CollectionManagerSchemaComponentProvider: React.FC = (props) => {
  const scope = useMemo(() => ({ cm: { ...hooks, useDataSourceFromRAC }, ds }), []);
  return (
    <SchemaComponentOptions scope={scope} components={components}>
      {props.children}
    </SchemaComponentOptions>
  );
};
