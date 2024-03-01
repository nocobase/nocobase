import React from 'react';
import { SchemaToolbar } from '../../../../schema-settings';

export const CollapseItemSchemaToolbar = (props) => {
  return <SchemaToolbar initializer={false} {...props} />;
};
