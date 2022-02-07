import React from 'react';
import * as components from '.';
import { SchemaComponentOptions } from '../core/SchemaComponentOptions';

export const AntdSchemaComponentProvider = (props) => {
  const { children } = props;
  return <SchemaComponentOptions components={{ ...(components as any) }}>{children}</SchemaComponentOptions>;
};
