import React from 'react';
import { observer } from '@formily/react';
import { VoidTable } from '../void-table';
import { TableProps } from 'antd';

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
