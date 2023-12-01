import { uid } from '@formily/shared';
import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { Icon } from '../../../icon';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { useAriaAttributeOfMenuItem, useSchemaInitializerMenuItems } from '../hooks';
import { SchemaInitializerMenu } from './SchemaInitializerSubMenu';
import { useSchemaInitializerStyles } from './style';
import { MenuProps } from 'antd';

export interface SchemaInitializerItemProps {
  style?: React.CSSProperties;
  className?: string;
  name?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  items?: any[];
  onClick?: (args?: any) => any;
  applyMenuStyle?: boolean;
  children?: ReactNode;
}

export const SchemaInitializerItem = React.forwardRef<any, SchemaInitializerItemProps>((props, ref) => {
  const { style, name = uid(), applyMenuStyle = true, className, items, icon, title, onClick, children } = props;
  const compile = useCompile();
  const childrenItems = useSchemaInitializerMenuItems(items, name, onClick);
  const { componentCls, hashId } = useSchemaInitializerStyles();
  const { attribute } = useAriaAttributeOfMenuItem();

  if (items && items.length > 0) {
    return (
      <SchemaInitializerMenu
        items={[
          {
            key: name,
            style: style,
            className: className,
            label: children || compile(title),
            onClick: (info) => {
              if (info.key !== name) return;
              onClick?.({ ...info, item: props });
            },
            icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
            children: childrenItems,
          },
        ]}
      ></SchemaInitializerMenu>
    );
  }

  return (
    <div
      ref={ref}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.({ event, item: props });
      }}
    >
      <div
        {...attribute}
        className={classNames({ [`${componentCls}-menu-item`]: applyMenuStyle }, className)}
        style={style}
      >
        {children || (
          <>
            {icon && typeof icon === 'string' ? <Icon type={icon as string} /> : icon}
            <span className={classNames({ [`${hashId} ${componentCls}-item-content`]: icon })}>{compile(title)}</span>
          </>
        )}
      </div>
    </div>
  );
});

export const SchemaInitializerItemInternal = () => {
  const itemConfig = useSchemaInitializerItem();
  return <SchemaInitializerItem {...itemConfig} />;
};
