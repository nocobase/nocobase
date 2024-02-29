import React from 'react';
import { SchemaToolbar } from '../../../../schema-settings';

export const TableColumnSchemaToolbar = (props) => {
  return <SchemaToolbar initializer={false} showBorder={false} showBackground {...props} />;
};
