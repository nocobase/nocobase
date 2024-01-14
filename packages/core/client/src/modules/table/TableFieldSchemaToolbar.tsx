import React from 'react';
import { SchemaToolbar } from '../../schema-settings';

export const TableFieldSchemaToolbar = (props) => {
  return <SchemaToolbar initializer={false} {...props} />;
};
