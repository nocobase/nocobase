/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useEffect } from 'react';
import { useRequest } from '@nocobase/client';
import { observer } from '@formily/react';
import { useLocation } from 'react-router-dom';

const EnvAndSecretsContext = createContext<any>({});

const EnvironmentVariablesAndSecretsProvider = observer(
  (props) => {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');
    const isSignPage = location.pathname.startsWith('/sign');

    const variablesRequest = useRequest<any>(
      {
        url: 'environmentVariables',
      },
      { manual: true },
    );
    const secretsRequest = useRequest<any>(
      {
        url: 'environmentSecrets',
      },
      { manual: true },
    );

    useEffect(() => {
      const tokenFromStorage = localStorage.getItem('NOCOBASE_TOKEN');
      if (tokenFromStorage && !variablesRequest.data && !secretsRequest.data) {
        variablesRequest.run();
        secretsRequest.run();
      }
    }, [location.pathname]);
    if (!isAdminPage || isSignPage) {
      return <>{props.children}</>;
    }
    return (
      <EnvAndSecretsContext.Provider value={{ variablesRequest, secretsRequest }}>
        {props.children}
      </EnvAndSecretsContext.Provider>
    );
  },
  {
    displayName: 'EnvironmentVariablesAndSecretsProvider',
  },
);

export { EnvironmentVariablesAndSecretsProvider, EnvAndSecretsContext };
