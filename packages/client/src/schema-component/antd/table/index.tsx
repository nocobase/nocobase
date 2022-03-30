import { TableArray } from './Table.Array';
import { TableArrayDesigner } from './Table.Array.Designer';
import { TableColumn } from './Table.Column';
import { TableColumnActionBar } from './Table.Column.ActionBar';
import { TableColumnDecorator } from './Table.Column.Decorator';
import { TableColumnDesigner } from './Table.Column.Designer';
import { TableDesigner } from './Table.Designer';
import { TableRowActionDesigner } from './Table.RowActionDesigner';
import { TableRowSelection } from './Table.RowSelection';
import { TableVoid } from './Table.Void';
import { TableVoidDesigner } from './Table.Void.Designer';

export const Table: any = () => null;

Table.Array = TableArray;
Table.Void = TableVoid;
Table.Void.Designer = TableVoidDesigner;
Table.RowSelection = TableRowSelection;

Table.Column = TableColumn;
Table.Column.ActionBar = TableColumnActionBar;
Table.Column.Decorator = TableColumnDecorator;
Table.Column.Designer = TableColumnDesigner;

Table.RowActionDesigner = TableRowActionDesigner;
Table.Designer = TableDesigner;
Table.Array.Designer = TableArrayDesigner;
