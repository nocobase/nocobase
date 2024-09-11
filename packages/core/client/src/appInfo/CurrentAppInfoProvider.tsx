/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';

export const CurrentAppInfoContext = createContext(null);
CurrentAppInfoContext.displayName = 'CurrentAppInfoContext';

export const useCurrentAppInfo = () => {
  return useContext<{
    data: {
      database: {
        dialect: string;
      };
      lang: string;
      version: string;
      exportLimit?: number;
    };
  }>(CurrentAppInfoContext);
};
export const CurrentAppInfoProvider = (props) => {
  const { render } = useAppSpin();
  const result = useRequest({
    url: 'app:getInfo',
  });
  if (result.loading) {
    return render();
  }
  return <CurrentAppInfoContext.Provider value={result.data}>{props.children}</CurrentAppInfoContext.Provider>;
};
