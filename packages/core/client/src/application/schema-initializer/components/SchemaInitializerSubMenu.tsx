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
  name: string;
  title?: string;
  onClick?: (args: any) => void;
  onOpenChange?: (openKeys: string[]) => void;
  icon?: string | ReactNode;
  children?: SchemaInitializerOptions['items'];
}

const SchemaInitializerSubMenuContext = React.createContext<{ isInMenu?: true }>({});
const SchemaInitializerMenuProvider = (props) => {
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
    () => items.map((item) => ({ ...item, popupClassName: `${hashId} ${componentCls}-menu-sub` })),
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
          }
          .ant-menu-item {
            margin-block: 0;
          }
          .ant-menu-root {
            margin: 0 -${token.margin}px;
            .ant-menu-submenu-title {
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
  const { children, title, name = uid(), onOpenChange, icon, ...others } = props;
  const compile = useCompile();
  const validChildren = children?.filter((item) => (item.useVisible ? item.useVisible() : true));
  const childrenItems = useSchemaInitializerMenuItems(validChildren, name);

  const items = useMemo(() => {
    return [
      {
        ...others,
        key: name,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        children: childrenItems,
      },
    ];
  }, [childrenItems, compile, icon, name, others, title]);
  return <SchemaInitializerMenu onOpenChange={onOpenChange} items={items}></SchemaInitializerMenu>;
};

export const SchemaInitializerSubMenuInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerSubMenuProps>();
  return <SchemaInitializerSubMenu {...itemConfig}></SchemaInitializerSubMenu>;
};
