/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const authenticator = searchParams.get('authenticator');

    if (!token) {
      return;
    }

    app.apiClient.auth.setToken(token);
    app.apiClient.auth.setAuthenticator(authenticator);
    searchParams.delete('token');

    const nextSearch = searchParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    );
  }, [app, location.pathname, location.search, navigate]);

  return <>{children}</>;
};

export default AuthProvider;
