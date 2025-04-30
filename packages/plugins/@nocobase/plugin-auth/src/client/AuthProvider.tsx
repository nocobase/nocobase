/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp, useLocationSearch } from '@nocobase/client';
import React, { useEffect } from 'react';

export const AuthProvider: React.FC = (props) => {
  const searchString = useLocationSearch();
  const app = useApp();
  const params = new URLSearchParams(searchString);
  const authenticator = params.get('authenticator');
  const token = params.get('token');
  if (token) {
    app.apiClient.auth.setToken(token);
    app.apiClient.auth.setAuthenticator(authenticator);
  }

  return <>{props.children}</>;
};
