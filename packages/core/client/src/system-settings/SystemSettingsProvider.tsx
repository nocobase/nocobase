/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '../api-client';

export const SystemSettingsContext = createContext<Result<any, any> | any>(null);
SystemSettingsContext.displayName = 'SystemSettingsContext';

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};

export const SystemSettingsProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const result = useRequest({
    url: 'systemSettings:get',
  });
  return <SystemSettingsContext.Provider value={{ ...result }}>{props.children}</SystemSettingsContext.Provider>;
};
