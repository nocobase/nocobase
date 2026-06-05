/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { useAPIClient, useRequest } from '@nocobase/client';
import { createContext } from 'react';

export const AISettingsContext = createContext<{
  storage: string;
}>({} as any);

export const AISettingsProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const api = useAPIClient();
  const { data } = useRequest<{
    storage: string;
  }>(() =>
    api
      .resource('aiSettings')
      .publicGet()
      .then((res) => res?.data?.data),
  );

  return <AISettingsContext.Provider value={data}>{props.children}</AISettingsContext.Provider>;
};

export const useAISettingsContext = () => {
  const ctx = useContext(AISettingsContext);
  return ctx;
};
