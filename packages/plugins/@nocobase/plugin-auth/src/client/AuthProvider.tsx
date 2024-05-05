/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient } from '@nocobase/client';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AuthProvider: React.FC = (props) => {
  const location = useLocation();
  const api = useAPIClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authenticator = params.get('authenticator');
    const token = params.get('token');
    if (token) {
      api.auth.setToken(token);
      api.auth.setAuthenticator(authenticator);
    }
  });
  return <>{props.children}</>;
};
