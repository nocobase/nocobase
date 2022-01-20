import { observer } from '@formily/react';
import { TableProps } from 'antd';
import React from 'react';
import { VoidTable } from '../void-table';

export const RowSelection: React.FC<TableProps<any> & { value?: any; onChange?: any }> = observer((props) => {
  const rowSelection: any = {
    type: 'checkbox',
    ...props.rowSelection,
    selectedRowKeys: props.value,
    onChange(selectedRowKeys?: any[]) {
      props.onChange(selectedRowKeys);
    },
  };
  return <VoidTable {...props} rowSelection={rowSelection} />;
});

VoidTable.mixin(RowSelection);
