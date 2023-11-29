import { theme } from 'antd';
import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { SchemaInitializerOptions } from '../types';
import { SchemaInitializerChildren } from './SchemaInitializerChildren';
import { SchemaInitializerDivider } from './SchemaInitializerDivider';
import { useSchemaInitializerStyles } from './style';

export interface SchemaInitializerItemGroupProps {
  title: string;
  children?: SchemaInitializerOptions['items'];
  divider?: boolean;
}

export const SchemaInitializerItemGroup: FC<SchemaInitializerItemGroupProps> = ({ children, title, divider }) => {
  const compile = useCompile();
  const { componentCls } = useSchemaInitializerStyles();
  const { token } = theme.useToken();
  return (
    <div style={{ marginInline: token.marginXXS }}>
      {divider && <SchemaInitializerDivider />}
      <div className={`${componentCls}-group-title`}>{compile(title)}</div>
      <SchemaInitializerChildren>{children}</SchemaInitializerChildren>
    </div>
  );
};

export const SchemaInitializerItemGroupInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerItemGroupProps>();
  return <SchemaInitializerItemGroup {...itemConfig} />;
};
