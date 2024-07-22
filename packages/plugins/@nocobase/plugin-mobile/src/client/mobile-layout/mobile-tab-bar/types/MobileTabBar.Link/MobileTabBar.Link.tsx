/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { useLocation } from 'react-router-dom';

import { MobileTabBarItemProps, MobileTabBarItem } from '../../MobileTabBar.Item';
import { useLinkActionProps } from '@nocobase/client';

export interface MobileTabBarLinkProps extends Omit<MobileTabBarItemProps, 'onClick' | 'selected'> {
  url: string;
}

export const MobileTabBarLink: FC<MobileTabBarLinkProps> = (props) => {
  const location = useLocation();
  const { onClick } = useLinkActionProps(props);

  const selected = location.pathname === props.url;

  return <MobileTabBarItem {...props} onClick={onClick} selected={selected} />;
};
