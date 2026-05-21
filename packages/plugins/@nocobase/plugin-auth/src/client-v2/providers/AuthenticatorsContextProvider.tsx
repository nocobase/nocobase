/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Spin } from 'antd';
import React, { FC, useEffect, useState } from 'react';
import { useApp } from '@nocobase/client-v2';
import { AuthenticatorsContext, type Authenticator } from '../authenticator';

const AuthenticatorsContextProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const app = useApp();
  const [state, setState] = useState<{
    authenticators: Authenticator[];
    error: any;
    loading: boolean;
  }>({
    authenticators: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    app.apiClient
      .resource('authenticators')
      .publicList()
      .then((res) => {
        if (!active) {
          return;
        }
        setState({
          authenticators: res?.data?.data || [],
          error: null,
          loading: false,
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setState({
          authenticators: [],
          error,
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, [app]);

  if (state.loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Spin />
      </div>
    );
  }

  if (state.error) {
    return <Alert type="error" showIcon message={state.error?.message || 'Failed to load authenticators'} />;
  }

  return <AuthenticatorsContext.Provider value={state.authenticators}>{children}</AuthenticatorsContext.Provider>;
};

export default AuthenticatorsContextProvider;
