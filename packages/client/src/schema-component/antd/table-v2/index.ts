import { TableColumnDeigner } from '../table/Table.Column.Deigner';
import { Table } from './Table';
import { TableActionColumnDesigner } from './Table.ActionColumnDesigner';
import { TableColumn } from './Table.Column';
import { TableColumnActionBar } from './Table.Column.ActionBar';
import { TableColumnDecorator } from './Table.Column.Decorator';

export * from './TableBlockDesigner';

export const TableV2 = Table;

TableV2.Column = TableColumn;
TableV2.Column.ActionBar = TableColumnActionBar;
TableV2.Column.Decorator = TableColumnDecorator;
TableV2.Column.Deigner = TableColumnDeigner;
TableV2.ActionColumnDesigner = TableActionColumnDesigner;
