import React from 'react';
import * as components from '.';
import * as common from '../common';
import { SchemaComponentOptions } from '../core/SchemaComponentOptions';
import { useFilterActionProps } from './filter/useFilterActionProps';

export const AntdSchemaComponentProvider = (props) => {
  const { children } = props;
  return <SchemaComponentOptions scope={{ useFilterActionProps }} components={{ ...components, ...common } as any}>{children}</SchemaComponentOptions>;
};
