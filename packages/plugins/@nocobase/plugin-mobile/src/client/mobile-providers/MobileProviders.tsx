/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { AdminProvider } from '@nocobase/client';

import { MobileTitleProvider, MobileRoutesProvider } from './context';

export interface MobileProvidersProps {
  children?: React.ReactNode;
  skipLogin?: boolean;
}

export const MobileProviders: FC<MobileProvidersProps> = ({ children, skipLogin }) => {
  const AdminProviderComponent = skipLogin ? React.Fragment : AdminProvider;

  return (
    <AdminProviderComponent>
      <MobileTitleProvider>
        <MobileRoutesProvider>{children}</MobileRoutesProvider>
      </MobileTitleProvider>
    </AdminProviderComponent>
  );
};
