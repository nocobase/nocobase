/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Icon } from '@nocobase/client';
import { Badge } from 'antd-mobile';
import classnames from 'classnames';

export interface MobileTabBarItemProps {
  // 图标
  icon?: string | React.ReactNode;
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
  if (!res) return undefined;
  if (typeof res === 'string') return <Icon type={res} />;
  return icon;
}

export const MobileTabBarItem: FC<MobileTabBarItemProps> = (props) => {
  const { title, onClick, selected, badge } = props;
  const icon = getIcon(props, selected);
  return (
    <div
      onClick={onClick}
      data-testid={`mobile-tab-bar-${title}`}
      className={classnames('adm-tab-bar-item', {
        ['adm-tab-bar-item-active']: selected,
      })}
      style={{ lineHeight: 1 }}
    >
      <Badge content={badge} style={{ '--top': '5px' }}>
        <span className={'adm-tab-bar-item-icon'}>{icon}</span>
      </Badge>
      <span
        className={classnames('adm-tab-bar-item-title', {
          ['adm-tab-bar-item-title-with-icon']: icon,
        })}
        style={{ fontSize: '12px' }}
      >
        {title}
      </span>
    </div>
  );
};
