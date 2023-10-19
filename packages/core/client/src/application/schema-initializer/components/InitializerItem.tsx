import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { Icon } from '../../../icon';
import { Menu } from 'antd';
import { useMenuItems } from '../hooks';
import { uid } from '@formily/shared';

export interface InitializerItemProps {
  style?: React.CSSProperties;
  className?: string;
  name?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  items?: any[];
  onClick: (args?: any) => any;
}

export const InitializerItem: FC<InitializerItemProps> = (props) => {
  const { style, name, className, items, icon, title, onClick, children } = props;
  const compile = useCompile();
  const menuItems = useMenuItems(name || `random-${uid()}`, onClick, items);
  if (items && items.length > 0) {
    return (
      <Menu
        items={[
          {
            key: name,
            label: compile(title),
            onClick: (info) => {
              if (info.key !== name) return;
              onClick({ ...info, item: props });
            },
            icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
            children: menuItems,
          },
        ]}
      ></Menu>
    );
  }

  return (
    <div onClick={onClick} style={style} className={className}>
      {children || (
        <>
          {typeof icon === 'string' ? <Icon type={icon as string} /> : icon}
          {compile(title)}
        </>
      )}
    </div>
  );
};
