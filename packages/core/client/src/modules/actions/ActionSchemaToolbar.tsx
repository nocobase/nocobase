import React from 'react';
import { SchemaToolbar } from '../../schema-settings/GeneralSchemaDesigner';

export const ActionSchemaToolbar = (props) => {
  return <SchemaToolbar initializer={false} showBorder={false} showBackground {...props} />;
};
