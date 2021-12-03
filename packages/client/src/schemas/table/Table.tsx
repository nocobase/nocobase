import React, { useState } from 'react';
import { observer } from '@formily/react';
import { CollectionProvider, DisplayedMapProvider } from '../../constate';
import { SimpleDesignableBar } from './SimpleDesignableBar';
import { useActionLogsResource } from './hooks/useActionLogsResource';
import { useTableDestroyAction } from './hooks/useTableDestroyAction';
import { useActionLogDetailsResource } from './hooks/useActionLogDetailsResource';
import { TableActionBar } from './TableActionBar';
import { TablePagination } from './TablePagination';
import { TableFilter } from './TableFilter';
import { TableFilterDesignableBar } from './TableFilterDesignableBar';
import { TableExportActionDesignableBar } from './TableExportActionDesignableBar';
import { useResource } from './hooks/useResource';
import { TableDesignableBar } from './TableDesignableBar';
import { useTableFilterAction } from './hooks/useTableFilterAction';
import { useTableCreateAction } from './hooks/useTableCreateAction';
import { useTableUpdateAction } from './hooks/useTableUpdateAction';
import { useTableExportAction } from './hooks/useTableExportAction';
import { useTableIndex } from './hooks/useTableIndex';
import { useTableRowRecord } from './hooks/useTableRowRecord';
import { TableSortHandle } from './TableSortHandle';
import { TableOperation } from './TableOperation';
import { TableOperationCell } from './TableOperationCell';
import { TableCell } from './TableCell';
import { TableColumn } from './TableColumn';
import { TableActionDesignableBar } from './TableActionDesignableBar';
import { TableOperationDesignableBar } from './TableOperationDesignableBar';
import { TableProvider } from './TableProvider';
import { TableIndex } from './TableIndex';
import { TableColumnDesignableBar } from './TableColumnDesignableBar';

export const Table: any = observer((props: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <CollectionProvider collectionName={props.collectionName}>
      <DisplayedMapProvider>
        <TableProvider {...props} />
      </DisplayedMapProvider>
    </CollectionProvider>
  );
});

Table.Pagination = TablePagination;
Table.ActionBar = TableActionBar;
Table.Filter = TableFilter;
Table.Filter.DesignableBar = TableFilterDesignableBar;
Table.ExportActionDesignableBar = TableExportActionDesignableBar;
Table.Operation = TableOperation;
Table.Operation.Cell = TableOperationCell;
Table.Operation.DesignableBar = TableOperationDesignableBar;
Table.Action = () => null;
Table.Action.DesignableBar = TableActionDesignableBar;
Table.Cell = TableCell;
Table.Column = TableColumn;
Table.Column.DesignableBar = TableColumnDesignableBar;
Table.SortHandle = TableSortHandle;
Table.DesignableBar = TableDesignableBar;
Table.SimpleDesignableBar = SimpleDesignableBar;
Table.Index = TableIndex;

Table.useResource = useResource;
Table.useActionLogDetailsResource = useActionLogDetailsResource;
Table.useActionLogsResource = useActionLogsResource;
Table.useTableFilterAction = useTableFilterAction;
Table.useTableCreateAction = useTableCreateAction;
Table.useTableUpdateAction = useTableUpdateAction;
Table.useTableDestroyAction = useTableDestroyAction;
Table.useTableExportAction = useTableExportAction;
Table.useTableIndex = useTableIndex;
Table.useTableRowRecord = useTableRowRecord;
