import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { InitializerChildren } from './InitializerChildren';
import { InitializerDivider } from './InitializerDivider';
import { SchemaInitializerOptions } from '../types';

export interface InitializerGroupProps {
  title: string;
  children: SchemaInitializerOptions['list'];
  name: string;
  divider?: boolean;
}

export const InitializerGroup: FC<InitializerGroupProps> = (props) => {
  const { children, title, divider } = props;
  const compile = useCompile();
  return (
    <div>
      {divider && <InitializerDivider />}
      <div className="ant-dropdown-menu-item-group-title">{compile(title)}</div>
      <InitializerChildren>{children}</InitializerChildren>
    </div>
  );
};
