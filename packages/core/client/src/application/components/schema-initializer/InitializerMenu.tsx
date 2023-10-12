import Icon from '@ant-design/icons';
import { Menu } from 'antd';
import React, { FC, ReactNode } from 'react';
import { SchemaInitializerOptions } from '../../SchemaInitializer';

export const InitializerMenu: FC<{
  title: string;
  onClick: (args: any) => void;
  icon: string | ReactNode;
  children?: SchemaInitializerOptions['list'];
}> = (props) => {
  const { children, title, onClick, icon } = props;
  return (
    <Menu
      items={[
        {
          key: title,
          label: title,
          icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
          onClick: (opts) => {
            onClick({ ...opts, item: props });
          },
          children: (children as SchemaInitializerOptions['list'])
            .sort((a, b) => (a.sort || 0) - (b.sort || 0))
            .map((item) => ({
              key: item.name,
              onClick: (opts) => {
                onClick({ ...opts, item: props });
              },
              label: React.createElement(item.Component, item.componentProps),
              children: item.children,
            })),
        },
      ]}
    ></Menu>
  );
};
