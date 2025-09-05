/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client';
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const AuthProvider: React.FC = (props) => {
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authenticator = params.get('authenticator');
    const token = params.get('token');

    if (token) {
      app.apiClient.auth.setToken(token);
      app.apiClient.auth.setAuthenticator(authenticator);

      params.delete('token');
      const newSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : '',
        },
        { replace: true },
      );
    }
  }, [location.search, app, navigate, location.pathname]);

  return <>{props.children}</>;
};
