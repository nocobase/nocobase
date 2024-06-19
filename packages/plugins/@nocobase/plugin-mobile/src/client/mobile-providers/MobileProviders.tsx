/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { AdminProvider, usePlugin } from '@nocobase/client';

import { PluginMobileClient } from '../index';
import { MobileTabContextProvider } from './context/MobileTab';
import { MobileTitleProvider } from './context/MobileTitle';

export interface MobileProvidersProps {
  children?: React.ReactNode;
}

export const MobileProviders: FC<MobileProvidersProps> = ({ children }) => {
  const mobilePlugin = usePlugin(PluginMobileClient);
  const AdminProviderComponent = mobilePlugin.options?.config?.skipLogin ? React.Fragment : AdminProvider;

  return (
    <AdminProviderComponent>
      <MobileTitleProvider>
        <MobileTabContextProvider>{children}</MobileTabContextProvider>
      </MobileTitleProvider>
    </AdminProviderComponent>
  );
};
