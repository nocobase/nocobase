import Icon from '@ant-design/icons';
import { Menu } from 'antd';
import React, { FC, ReactNode } from 'react';
import { SchemaInitializerOptions } from '../types';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerMenuItems } from '../hooks';
import { uid } from '@formily/shared';

export interface SchemaInitializerMenuProps {
  title: string;
  name: string;
  onClick: (args: any) => void;
  icon: string | ReactNode;
  children?: SchemaInitializerOptions['items'];
}

export const SchemaInitializerMenu: FC<SchemaInitializerMenuProps> = (props) => {
  const { children, title, name = uid(), icon } = props;
  const compile = useCompile();
  const childrenItems = useSchemaInitializerMenuItems(children, name);

  return (
    <Menu
      items={[
        {
          key: name,
          label: compile(title),
          icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
          children: childrenItems,
        },
      ]}
    ></Menu>
  );
};
