/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Outlet } from 'react-router-dom';

import { MobileTabBar } from '../mobile-tab-bar';

export interface MobileLayoutProps {
  children?: React.ReactNode;
}

export const MobileLayout: FC<MobileLayoutProps> = () => {
  return (
    <>
      <Outlet />
      <MobileTabBar />
    </>
  );
};
