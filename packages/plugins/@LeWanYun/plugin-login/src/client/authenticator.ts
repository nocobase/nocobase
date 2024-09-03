/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

export type Authenticator = {
  name: string;
  authType: string;
  authTypeTitle: string;
  title?: string;
  options?: {
    [key: string]: any;
  };
  sort?: number;
};

export const AuthenticatorsContext = createContext<Authenticator[]>([]);
AuthenticatorsContext.displayName = 'AuthenticatorsContext';

export const useAuthenticator = (name: string) => {
  const authenticators = useContext(AuthenticatorsContext);
  return authenticators.find((a) => a.name === name);
};
