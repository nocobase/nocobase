/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { Table, TableWithoutDynamicSchemaProps } from './Table';
import { TableActionColumnDesigner } from './Table.ActionColumnDesigner';
import { TableColumn } from './Table.Column';
import { TableColumnActionBar } from './Table.Column.ActionBar';
import { TableColumnDecorator } from './Table.Column.Decorator';
import { TableColumnDesigner } from './Table.Column.Designer';
import { TableIndex } from './Table.Index';
import { TableSelector } from './TableSelector';

export { useColumnSchema } from './Table.Column.Decorator';
export * from './TableBlockDesigner';
export * from './TableField';
export * from './TableSelectorDesigner';

export const TableV2 = Table;

TableV2.Column = TableColumn;
TableV2.Column.ActionBar = TableColumnActionBar;
TableV2.Column.Decorator = TableColumnDecorator;
TableV2.Column.Designer = TableColumnDesigner;
TableV2.ActionColumnDesigner = TableActionColumnDesigner;
TableV2.Selector = TableSelector;
TableV2.Index = TableIndex;

/**
 * V3 aims to achieve better performance than V2 while maintaining full backwards compatibility.
 */
export const TableV3: any = withDynamicSchemaProps(
  (props) => <TableWithoutDynamicSchemaProps {...props} optimizeTextCellRender={true} />,
  {
    displayName: 'NocoBaseTableV3',
  },
);

TableV3.Column = TableColumn;
TableV3.Column.ActionBar = TableColumnActionBar;
TableV3.Column.Decorator = TableColumnDecorator;
TableV3.Column.Designer = TableColumnDesigner;
TableV3.ActionColumnDesigner = TableActionColumnDesigner;
TableV3.Selector = TableSelector;
TableV3.Index = TableIndex;
