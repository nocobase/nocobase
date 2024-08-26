/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AdminProvider } from '@nocobase/client';
import React, { FC, useEffect } from 'react';

import { MobileRoutesProvider, MobileTitleProvider } from './context';

export interface MobileProvidersProps {
  children?: React.ReactNode;
  skipLogin?: boolean;
}

export const MobileProviders: FC<MobileProvidersProps> = ({ children, skipLogin }) => {
  const AdminProviderComponent = skipLogin ? React.Fragment : AdminProvider;

  useEffect(() => {
    document.body.style.setProperty('--nb-mobile-page-tabs-content-padding', '12px');
    document.body.style.setProperty('--nb-mobile-page-header-height', '50px');
  }, []);

  return (
    <AdminProviderComponent>
      <MobileTitleProvider>
        <MobileRoutesProvider>{children}</MobileRoutesProvider>
      </MobileTitleProvider>
    </AdminProviderComponent>
  );
};
