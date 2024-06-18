/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { Badge, TabBar as AntdTabBar, TabBarItemProps as AntdTabBarItemProps } from 'antd-mobile';
import { Icon } from '@nocobase/client';

export interface TabBarItemProps extends Omit<AntdTabBarItemProps, 'badge' | 'icon'> {
  icon?: React.ReactNode | string;
  selectedIcon?: React.ReactNode | string;
  useBadge?: () => string | number | boolean;
  selected?: boolean;
}

const useDefaultBadge = () => undefined;

export const TabBarItem: FC<TabBarItemProps> = (props) => {
  const { icon, selectedIcon, useBadge = useDefaultBadge, selected, style, className, title } = props;
  const badge = useBadge();
  const badgeValue = useMemo(() => {
    if (badge === true) {
      return Badge.dot;
    }

    if (typeof badge === 'number' || typeof badge === 'string') {
      return badge;
    }
    return undefined;
  }, [badge]);

  const iconValue = useMemo(() => {
    const res = selected && selectedIcon ? selectedIcon : icon;
    if (typeof res === 'string') return <Icon type={res} />;
    return icon;
  }, [icon, selectedIcon, selected]);

  return <AntdTabBar.Item badge={badgeValue} icon={iconValue} style={style} title={title} className={className} />;
};

TabBarItem.displayName = 'NocoBaseTabBarItem';
