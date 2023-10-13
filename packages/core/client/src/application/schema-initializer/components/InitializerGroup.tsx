import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { InitializerChildren } from './InitializerChildren';
import { SchemaInitializerOptions } from '../types';

export interface InitializerGroupProps {
  title: string;
  children: SchemaInitializerOptions['list'];
  name: string;
}

export const InitializerGroup: FC<InitializerGroupProps> = (props) => {
  const { children, title } = props;
  const compile = useCompile();
  return (
    <div>
      <div className="ant-dropdown-menu-item-group-title">{compile(title)}</div>
      <InitializerChildren>{children}</InitializerChildren>
    </div>
  );
};
