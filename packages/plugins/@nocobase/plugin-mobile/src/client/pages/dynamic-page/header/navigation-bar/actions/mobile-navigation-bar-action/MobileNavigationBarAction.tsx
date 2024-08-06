/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { Button, ButtonProps, Space } from 'antd-mobile';
import { cx, Icon, useSchemaToolbar } from '@nocobase/client';
import { useStyles } from './styles';

interface MobileNavigationBarActionProps extends ButtonProps {
  icon?: string | React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const MobileNavigationBarAction: FC<MobileNavigationBarActionProps> = React.forwardRef<
  any,
  MobileNavigationBarActionProps
>((props, ref) => {
  const { icon, color, fill, children, style = {}, className, onClick } = props;
  const { position } = useSchemaToolbar();
  const title = children[0];
  const designer = children[1];
  const contentLength = [icon, title].filter(Boolean).length;
  const iconElement = useMemo(() => (typeof icon === 'string' ? <Icon type={icon} /> : icon), [icon]);
  const { styles } = useStyles();
  return (
    <div ref={ref}>
      <Button
        onClick={onClick}
        color={color}
        size={contentLength <= 1 ? undefined : 'mini'}
        className={cx(className, styles.navigationBarAction, {
          [styles.navigationBarActionIconAndTitle]: contentLength > 1,
          [styles.navigationBarActionTitle]: contentLength === 1 && title,
          [styles.navigationBarActionIcon]: contentLength === 1 && icon,
        })}
        style={style}
        fill={contentLength <= 1 ? 'none' : fill}
      >
        {designer}
        {contentLength > 1 ? (
          position === 'left' ? (
            <Space style={{ '--gap': '6px' }}>
              {iconElement}
              <span>{title}</span>
            </Space>
          ) : (
            <Space style={{ '--gap': '6px' }}>
              <span>{title}</span>
              {iconElement}
            </Space>
          )
        ) : (
          <Space>{iconElement || title}</Space>
        )}
      </Button>
    </div>
  );
});

MobileNavigationBarAction.displayName = 'MobileNavigationBarAction';
