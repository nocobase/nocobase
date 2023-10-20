import Icon from '@ant-design/icons';
import { Menu } from 'antd';
import React, { FC, ReactNode } from 'react';
import { useInitializerChildren, useSchemaInitializerV2 } from '../hooks';
import { SchemaInitializerOptions } from '../types';
import { useCompile } from '../../../schema-component';

export interface SchemaInitializerMenuProps {
  title: string;
  name: string;
  onClick: (args: any) => void;
  icon: string | ReactNode;
  children?: SchemaInitializerOptions['list'];
}

export const SchemaInitializerMenu: FC<SchemaInitializerMenuProps> = (props) => {
  const { children, title, name, icon } = props;
  const validChildren = useInitializerChildren(children);
  const { insert } = useSchemaInitializerV2();
  const compile = useCompile();

  return (
    <Menu
      items={[
        {
          key: name,
          label: compile(title),
          icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
          children: validChildren.map((item) => {
            const { name, Component, icon, ...props } = item;
            return {
              label: React.createElement(Component, { name, insert, ...props }),
              key: name,
              icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
            };
          }),
        },
      ]}
    ></Menu>
  );
};
