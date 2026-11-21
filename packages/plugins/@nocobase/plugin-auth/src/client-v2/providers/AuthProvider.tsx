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
    if (!app.applyAuthCallback(searchParams)) {
      return;
    }

    searchParams.delete('token');
    searchParams.delete('authenticator');

    const nextSearch = searchParams.toString();
    navigate(
      {
        pathname: location.pathname,
        hash: location.hash,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    );
  }, [app, location.pathname, location.search, location.hash, navigate]);

  return <>{children}</>;
};

export default AuthProvider;
