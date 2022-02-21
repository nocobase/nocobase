import React from 'react';
import * as components from '.';
import * as common from '../common';
import { SchemaComponentOptions } from '../core/SchemaComponentOptions';

export const AntdSchemaComponentProvider = (props) => {
  const { children } = props;
  return <SchemaComponentOptions components={{ ...components, ...common } as any}>{children}</SchemaComponentOptions>;
};
