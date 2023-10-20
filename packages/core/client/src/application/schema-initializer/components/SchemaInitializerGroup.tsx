import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerChildren } from './SchemaInitializerChildren';
import { SchemaInitializerDivider } from './SchemaInitializerDivider';
import { SchemaInitializerOptions } from '../types';

export interface SchemaInitializerGroupProps {
  title: string;
  children: SchemaInitializerOptions['list'];
  name: string;
  divider?: boolean;
}

export const SchemaInitializerGroup: FC<SchemaInitializerGroupProps> = (props) => {
  const { children, title, divider } = props;
  const compile = useCompile();
  return (
    <div>
      {divider && <SchemaInitializerDivider />}
      <div className="ant-dropdown-menu-item-group-title">{compile(title)}</div>
      <SchemaInitializerChildren>{children}</SchemaInitializerChildren>
    </div>
  );
};
