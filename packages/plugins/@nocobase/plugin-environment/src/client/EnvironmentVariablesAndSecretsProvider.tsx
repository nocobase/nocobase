/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext } from 'react';
import { useRequest } from '@nocobase/client';
import { observer } from '@formily/react';

const EnvAndSecretsContext = createContext<any>({});

const EnvironmentVariablesAndSecretsProvider = observer(
  (props) => {
    const isAdminPage = location.pathname.startsWith('/admin');
    if (!isAdminPage) {
      return <>{props.children}</>;
    }
    const variablesRequest = useRequest<any>({
      url: 'environmentVariables',
    });
    const secretsRequest = useRequest<any>({
      url: 'environmentSecrets',
    });

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
