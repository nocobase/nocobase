import React from 'react';
import * as components from '.';
import { SchemaComponentOptions } from '../components/SchemaComponentOptions';

export const AntdSchemaComponentProvider = (props) => {
  const { children } = props;
  return <SchemaComponentOptions components={{ ...(components as any) }}>{children}</SchemaComponentOptions>;
};
