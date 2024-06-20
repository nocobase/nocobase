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

import { MobileTabBarItemProps, MobileTabBarItem } from '../MobileTabBar.Item';

export interface MobileTabBarSchemaProps extends Omit<MobileTabBarItemProps, 'onClick' | 'selected'> {
  schemaId: string;
}

export const MobileTabBarSchema: FC<MobileTabBarSchemaProps> = (props) => {
  const { schemaId, ...rests } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    navigate(`/schema/${schemaId}`);
  };

  const selected = location.pathname === `/schema/${schemaId}`;

  return <MobileTabBarItem {...rests} onClick={handleClick} selected={selected} />;
};
