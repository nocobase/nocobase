/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { usePlugin } from '@nocobase/client';
import { PluginMobileClient } from '../index';

export const Mobile = () => {
  const mobilePlugin = usePlugin(PluginMobileClient);
  const RouterComponent = mobilePlugin.getRouterComponent();
  return <RouterComponent />;
};
