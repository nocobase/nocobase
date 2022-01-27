import { Field } from '@formily/core';
import { observer, useField } from '@formily/react';
import { isArr, isValid } from '@formily/shared';
import { TableProps } from 'antd';
import React from 'react';
import { VoidTable } from '../void-table';

type Props = TableProps<any> & { value?: any; onChange?: any };

const toArr = (value: any) => (isArr(value) ? value : isValid(value) ? [value] : []);

export const RowSelection = observer((props: Props) => {
  const field = useField<Field>();
  const rowSelection: any = {
    type: 'checkbox',
    ...props.rowSelection,
    selectedRowKeys: toArr(field.value),
    onChange(selectedRowKeys?: any[]) {
      if (rowSelection.type === 'checkbox') {
        props.onChange(selectedRowKeys);
      } else {
        props.onChange([...selectedRowKeys].shift());
      }
    },
  };
  return <VoidTable {...props} rowSelection={rowSelection} />;
});

VoidTable.mixin(RowSelection);
