/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ReactNode } from 'react';
import { APIClient } from './APIClient';
import { APIClientContext } from './context';

export interface APIClientProviderProps {
  apiClient: APIClient;
  children?: ReactNode;
}

export const APIClientProvider: React.FC<APIClientProviderProps> = (props) => {
  const { apiClient, children } = props;
  return <APIClientContext.Provider value={apiClient}>{children}</APIClientContext.Provider>;
};
