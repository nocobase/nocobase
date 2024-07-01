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

export interface MobileTabBarPageProps extends Omit<MobileTabBarItemProps, 'onClick' | 'selected'> {
  schemaPageUid: string;
}

export const MobileTabBarPage: FC<MobileTabBarPageProps> = (props) => {
  const { schemaPageUid, ...rests } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const url = `/schema/${schemaPageUid}`;
  const handleClick = () => {
    navigate(url);
  };

  const selected = location.pathname.startsWith(url);

  return <MobileTabBarItem {...rests} onClick={handleClick} selected={selected} />;
};
