/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import classNames from 'classnames';
import React, { ReactNode, memo, useMemo } from 'react';
import { Icon } from '../../../icon';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializer, useSchemaInitializerItem } from '../context';
import { useAriaAttributeOfMenuItem, useSchemaInitializerMenuItems } from '../hooks';
import { SchemaInitializerMenu } from './SchemaInitializerSubMenu';
import { useSchemaInitializerStyles } from './style';

export interface SchemaInitializerItemProps {
  style?: React.CSSProperties;
  className?: string;
  name?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  items?: any[];
  disabled?: boolean;
  onClick?: (args?: any) => any;
  applyMenuStyle?: boolean;
  children?: ReactNode;
  /**
   * @internal
   */
  closeInitializerMenuWhenClick?: boolean;
}

export const SchemaInitializerItem = memo(
  React.forwardRef<any, SchemaInitializerItemProps>((props, ref) => {
    const {
      style,
      closeInitializerMenuWhenClick = true,
      name = uid(),
      applyMenuStyle = true,
      className,
      disabled,
      items,
      icon,
      title,
      onClick,
      children,
    } = props;
    const compile = useCompile();
    const childrenItems = useSchemaInitializerMenuItems(items, name, onClick);
    const { componentCls, hashId } = useSchemaInitializerStyles();
    const { attribute } = useAriaAttributeOfMenuItem();
    const { setVisible } = useSchemaInitializer();
    const menuItems = useMemo(() => {
      if (!(items && items.length > 0)) return undefined;
      return [
        {
          key: name,
          style: style,
          className: className,
          label: children || compile(title),
          onClick: (info) => {
            if (disabled || info.key !== name) return;
            if (closeInitializerMenuWhenClick) {
              setVisible?.(false);
            }
            onClick?.({ ...info, item: props });
          },
          icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
          children: childrenItems,
        },
      ];
    }, [name, disabled, style, className, children, title, onClick, icon, childrenItems]);

    if (items && items.length > 0) {
      return <SchemaInitializerMenu disabled={disabled} items={menuItems}></SchemaInitializerMenu>;
    }
    return (
      <div
        ref={ref}
        onClick={(event) => {
          event.stopPropagation();
          if (closeInitializerMenuWhenClick) {
            setVisible?.(false);
          }
          onClick?.({ event, item: props });
        }}
      >
        <div
          {...attribute}
          className={classNames(
            { [`${componentCls}-menu-item`]: applyMenuStyle, [`${componentCls}-menu-item-disabled`]: disabled },
            className,
          )}
          style={style}
        >
          {children || (
            <>
              {typeof icon === 'string' ? <Icon type={icon} /> : icon}
              <span className={classNames({ [`${hashId} ${componentCls}-item-content`]: !!icon })}>
                {compile(title)}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }),
);
SchemaInitializerItem.displayName = 'SchemaInitializerItem';

/**
 * @internal
 */
export const SchemaInitializerItemInternal = () => {
  const itemConfig = useSchemaInitializerItem();
  return <SchemaInitializerItem {...itemConfig} />;
};
