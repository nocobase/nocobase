/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC } from 'react';
import { useRequest, UseRequestResult } from '@nocobase/client';

const PluginSettingsTableContext = createContext<UseRequestResult<{ data?: any[] }>>(null as any);

export const PluginSettingsTableProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const request = useRequest<{ data?: any[] }>({
    url: 'printTemplate:list',
  });

  // console.log('PluginSettingsTableProvider', request.data?.data);

  return <PluginSettingsTableContext.Provider value={request}>{children}</PluginSettingsTableContext.Provider>;
};

export const usePluginSettingsTableRequest = () => {
  return React.useContext(PluginSettingsTableContext);
};
