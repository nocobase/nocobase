import React from 'react';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { SchemaInitializerOptions } from '../types';
import { SchemaInitializerChildren } from './SchemaInitializerChildren';
import { SchemaInitializerDivider } from './SchemaInitializerDivider';
import { useStyles } from './style';

export interface SchemaInitializerGroupProps {
  name: string;
  title: string;
  children?: SchemaInitializerOptions['items'];
  divider?: boolean;
}

export const SchemaInitializerGroup = () => {
  const { children, title, divider } = useSchemaInitializerItem<SchemaInitializerGroupProps>();
  const compile = useCompile();
  const { componentCls } = useStyles();
  return (
    <div>
      {divider && <SchemaInitializerDivider />}
      <div className={`${componentCls}-group-title`}>{compile(title)}</div>
      <SchemaInitializerChildren>{children}</SchemaInitializerChildren>
    </div>
  );
};
