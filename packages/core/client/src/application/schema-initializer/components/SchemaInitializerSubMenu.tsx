/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Icon, { RightOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { uid } from '@formily/shared';
import { Menu, MenuProps, theme } from 'antd';
import React, { FC, ReactNode, useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { useSchemaInitializerMenuItems } from '../hooks';
import { SchemaInitializerOptions } from '../types';
import { useSchemaInitializerStyles } from './style';

export interface SchemaInitializerSubMenuProps {
  name?: string;
  title?: string;
  onClick?: (args: any) => void;
  onOpenChange?: (openKeys: string[]) => void;
  icon?: string | ReactNode;
  children?: SchemaInitializerOptions['items'];
  items?: SchemaInitializerOptions['items'];
}

const SchemaInitializerSubMenuContext = React.createContext<{ isInMenu?: true }>({});
/**
 * @internal
 */
export const SchemaInitializerMenuProvider = (props) => {
  return (
    <SchemaInitializerSubMenuContext.Provider value={{ isInMenu: true }}>
      {props.children}
    </SchemaInitializerSubMenuContext.Provider>
  );
};
export const useSchemaInitializerSubMenuContext = () => {
  return React.useContext(SchemaInitializerSubMenuContext);
};

export const SchemaInitializerMenu: FC<MenuProps> = (props) => {
  const { componentCls, hashId } = useSchemaInitializerStyles();
  const { items, ...others } = props;
  const { token } = theme.useToken();
  const itemsWithPopupClass = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        popupClassName: `${hashId} ${componentCls}-menu-sub`,
      })),
    [componentCls, hashId, items],
  );
  // selectedKeys 为了不让有选中效果
  return (
    <SchemaInitializerMenuProvider>
      <Menu
        selectable={false}
        expandIcon={<RightOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }} />}
        rootClassName={css`
          box-shadow: none !important;
          border-inline-end: 0 !important;
          .ant-menu-sub {
            max-height: 50vh !important;
            padding: ${token.paddingXXS}px !important;
          }
          .ant-menu-item {
            margin-inline: ${token.marginXXS}px !important;
            margin-block: 0 !important;
            width: auto !important;
            padding: 0 ${token.paddingSM}px 0 ${token.padding}px !important;
          }
          .ant-menu-item-group-title {
            padding: 0 ${token.padding}px;
            margin-inline: 0;
            line-height: 32px;
          }
          .ant-menu-submenu-title {
            margin: 0 ${token.marginXXS}px !important;
            padding-left: ${token.padding}px !important;
            width: auto !important;
          }
          .ant-menu-root {
            margin: 0 -${token.margin}px;
            .ant-menu-submenu-title,
            .ant-menu-item-only-child {
              margin-inline: 0;
              margin-block: 0;
              width: 100%;
            }
          }
        `}
        items={itemsWithPopupClass}
        {...others}
      />
    </SchemaInitializerMenuProvider>
  );
};

export const SchemaInitializerSubMenu: FC<SchemaInitializerSubMenuProps> = (props) => {
  const { children, items: propItems, title, name, onOpenChange, icon, ...others } = props;
  const compile = useCompile();
  const schemaInitializerItem = useSchemaInitializerItem();
  const nameValue = useMemo(() => name || schemaInitializerItem?.name || uid(), [name, schemaInitializerItem]);
  const validChildren = (propItems || children)?.filter((item) => (item.useVisible ? item.useVisible() : true));
  const childrenItems = useSchemaInitializerMenuItems(validChildren, name);

  const items = useMemo(() => {
    return [
      {
        ...others,
        key: nameValue,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        children: childrenItems,
      },
    ];
  }, [childrenItems, compile, icon, nameValue, others, title]);
  return <SchemaInitializerMenu onOpenChange={onOpenChange} items={items}></SchemaInitializerMenu>;
};

/**
 * @internal
 */
export const SchemaInitializerSubMenuInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerSubMenuProps>();
  return <SchemaInitializerSubMenu {...itemConfig}></SchemaInitializerSubMenu>;
};
