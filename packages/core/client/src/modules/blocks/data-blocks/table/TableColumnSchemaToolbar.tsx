/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import React from 'react';
import { GridRowContext } from '../../../../schema-component/antd/grid/Grid';
import { SchemaToolbar } from '../../../../schema-settings';

export const TableColumnSchemaToolbar = (props) => {
  return (
    <GridRowContext.Provider value={null}>
      <SchemaToolbar
        initializer={props.initializer || false}
        showBorder={false}
        showBackground
        {..._.omit(props, 'initializer')}
      />
    </GridRowContext.Provider>
  );
};
