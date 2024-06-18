/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Icon } from '@nocobase/client';
import { Badge } from 'antd-mobile';
import React, { FC } from 'react';

export interface MobileTabBarItemProps {
  // 图标
  icon?: string;
  // 选中时的图标
  selectedIcon?: string;
  // 标题
  title?: string;
  // 点击事件
  onClick?: () => void;
  // 是否选中
  selected?: boolean;
  // 是否显示徽标
  badge?: number | string | boolean;
}

function getIcon(item: MobileTabBarItemProps, selected?: boolean) {
  const { icon, selectedIcon } = item;
  const res = selected && selectedIcon ? selectedIcon : icon;
  if (typeof res === 'string') return <Icon type={res} />;
  return icon;
}

export const MobileTabBarItem: FC<MobileTabBarItemProps> = (props) => {
  const { title, onClick, selected, badge } = props;

  return (
    <Badge content={badge}>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: selected ? 'red' : undefined,
        }}
      >
        <span>{getIcon(props, selected)}</span>
        <span>{title}</span>
      </div>
    </Badge>
  );
};
