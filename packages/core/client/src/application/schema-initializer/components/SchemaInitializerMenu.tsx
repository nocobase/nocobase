import Icon from '@ant-design/icons';
import { Menu } from 'antd';
import React, { ReactNode, useMemo } from 'react';
import { SchemaInitializerOptions } from '../types';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerMenuItems } from '../hooks';
import { uid } from '@formily/shared';
import { useSchemaInitializerItem } from '../context';
import { useStyles } from './style';

export interface SchemaInitializerMenuProps {
  title: string;
  name: string;
  onClick: (args: any) => void;
  icon: string | ReactNode;
  children?: SchemaInitializerOptions['items'];
}

export const SchemaInitializerMenu = (props) => {
  const { children, title, name = uid(), icon, ...others } = useSchemaInitializerItem<SchemaInitializerMenuProps>();
  const { children: _unUse, ...otherProps } = props;
  const compile = useCompile();
  const childrenItems = useSchemaInitializerMenuItems(children, name);
  const { componentCls, hashId } = useStyles();
  const items = useMemo(() => {
    return [
      {
        ...others,
        key: name,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        popupClassName: `${hashId} ${componentCls}-menu-sub`,
        children: childrenItems,
      },
    ];
  }, [childrenItems, compile, componentCls, hashId, icon, name, others, title]);
  return <Menu selectedKeys={[]} items={items} {...otherProps}></Menu>;
};
