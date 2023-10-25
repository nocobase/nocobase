import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { Icon } from '../../../icon';
import { Menu } from 'antd';
import { useSchemaInitializerMenuItems } from '../hooks';
import { uid } from '@formily/shared';
import { useStyles } from './style';
import classNames from 'classnames';

export interface SchemaInitializerItemProps {
  style?: React.CSSProperties;
  className?: string;
  name?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  items?: any[];
  onClick?: (args?: any) => any;
}

export const SchemaInitializerItem = React.forwardRef<any, SchemaInitializerItemProps>((props, ref) => {
  const { style, name = uid(), className, items, icon, title, onClick, children } = props;
  const compile = useCompile();
  const childrenItems = useSchemaInitializerMenuItems(items, name || `random-${uid()}`, onClick);
  const { styles } = useStyles();
  if (items && items.length > 0) {
    return (
      <Menu
        ref={ref}
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
      ></Menu>
    );
  }

  return (
    <div ref={ref} onClick={() => onClick?.({ item: props })} style={style} className={className}>
      <div className={styles['nbMenuItem']}>
        {children || (
          <>
            {icon && <span>{typeof icon === 'string' ? <Icon type={icon as string} /> : icon}</span>}
            <span className={icon ? styles['nbMenuItemContent'] : undefined}>{compile(title)}</span>
          </>
        )}
      </div>
    </div>
  );
});
