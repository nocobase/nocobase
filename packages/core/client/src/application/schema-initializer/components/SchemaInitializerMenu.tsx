import Icon from '@ant-design/icons';
import { Menu } from 'antd';
import React, { ReactNode } from 'react';
import { SchemaInitializerOptions } from '../types';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerMenuItems } from '../hooks';
import { uid } from '@formily/shared';
import { useSchemaInitializerItem } from '../context';

export interface SchemaInitializerMenuProps {
  title: string;
  name: string;
  onClick: (args: any) => void;
  icon: string | ReactNode;
  children?: SchemaInitializerOptions['items'];
}

export const SchemaInitializerMenu = () => {
  const { children, title, name = uid(), icon, ...others } = useSchemaInitializerItem<SchemaInitializerMenuProps>();
  const compile = useCompile();
  const childrenItems = useSchemaInitializerMenuItems(children, name);

  return (
    <Menu
      items={[
        {
          ...others,
          key: name,
          label: compile(title),
          icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
          children: childrenItems,
        },
      ]}
    ></Menu>
  );
};
