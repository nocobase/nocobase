/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { RemoteSchemaComponent, usePlugin } from '@nocobase/client';

import { PluginMobileClient } from '../index';
import { MobileProviders } from '../mobile-providers';

export interface MobileLayoutProps {
  children?: React.ReactNode;
}

export const MobileLayout: FC<MobileLayoutProps> = () => {
  const mobilePlugin = usePlugin(PluginMobileClient);

  return (
    <MobileProviders skipLogin={mobilePlugin?.options?.config?.skipLogin}>
      <RemoteSchemaComponent uid="nocobase-mobile" />
    </MobileProviders>
  );
};
