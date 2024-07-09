/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { Space } from 'antd-mobile';
import { Icon, cx } from '@nocobase/client';

import { useStyles } from './styles';

interface MobileNavigationBarActionProps {
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
  const { icon, title, children, style = {}, className, onClick } = props;
  const { styles } = useStyles();

  const contentLength = [icon, title].filter(Boolean).length;
  const iconElement = useMemo(() => (typeof icon === 'string' ? <Icon type={icon} /> : icon), [icon]);
  return (
    <div ref={ref} onClick={onClick} className={cx(styles.mobileNavigationBarAction, className)} style={style}>
      {children}
      {contentLength > 1 ? (
        <Space>
          {iconElement}
          <span>{title}</span>
        </Space>
      ) : (
          iconElement || title
      )}
    </div>
  );
});
