import { ArrayBase, ArrayTable as FormilyArrayTable } from '@formily/antd';
import { connect } from '@formily/react';
import React, { Fragment } from 'react';

export const ArrayTable: any = connect((props) => {
  const { onChange } = props;
  return (
    <FormilyArrayTable
      {...props}
      onChange={(value) => {
        console.log('onChange', value);
        onChange(value);
      }}
    />
  );
});

ArrayTable.displayName = 'ArrayTable'

ArrayTable.Column = () => {
  return <Fragment />
}

ArrayBase.mixin(ArrayTable)

