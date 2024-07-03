/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { MobileTabBarItemProps, MobileTabBarItem } from '../../MobileTabBar.Item';

export interface MobileTabBarLinkProps extends Omit<MobileTabBarItemProps, 'onClick' | 'selected'> {
  link: string;
}

export const MobileTabBarLink: FC<MobileTabBarLinkProps> = (props) => {
  const { link, ...rests } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (!link) return;
    if (link.startsWith('http') || link.startsWith('//')) {
      window.open(link);
    } else {
      navigate(link);
    }
  };

  const selected = location.pathname === link;

  return <MobileTabBarItem {...rests} onClick={handleClick} selected={selected} />;
};
