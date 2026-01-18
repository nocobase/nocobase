/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Badge } from 'antd-mobile';
import classnames from 'classnames';
import React, { FC } from 'react';
import { useRouteTranslation } from '../../../locale';
import { Icon } from '../../../../icon';
import { useCompile } from '../../../../schema-component';

export interface MobileTabBarItemProps {
  icon?: string | React.ReactNode;
  selectedIcon?: string;
  title?: string;
  onClick?: () => void;
  selected?: boolean;
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
  const { t } = useRouteTranslation();
  const compile = useCompile();
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
        {t(compile(title))}
      </span>
    </div>
  );
};
