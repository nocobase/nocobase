/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { useIsLoggedIn, useRequest } from '@nocobase/client';
import React, { createContext } from 'react';

const EnvAndSecretsContext = createContext<any>({});

const InternalProvider = (props) => {
  const variablesRequest = useRequest<any>({
    url: 'environmentVariables?paginate=false',
  });
  return <EnvAndSecretsContext.Provider value={{ variablesRequest }}>{props.children}</EnvAndSecretsContext.Provider>;
};

const EnvironmentVariablesAndSecretsProvider = observer(
  (props) => {
    const isLoggedIn = useIsLoggedIn();
    if (!isLoggedIn) {
      return <>{props.children}</>;
    }
    return <InternalProvider {...props} />;
  },
  {
    displayName: 'EnvironmentVariablesAndSecretsProvider',
  },
);

export { EnvAndSecretsContext, EnvironmentVariablesAndSecretsProvider };
