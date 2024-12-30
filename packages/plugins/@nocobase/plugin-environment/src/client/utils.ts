/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext } from 'react';
import { EnvAndSecretsContext } from './EnvironmentVariablesAndSecretsProvider';

export const useGetEnvironmentVariables = () => {
  const { variablesRequest } = useContext(EnvAndSecretsContext);
  const { data: variables, loading: variablesLoading } = variablesRequest || {};
  if (!variablesLoading && variables?.data?.length) {
    return {
      name: '$env',
      title: 'Environment',
      value: '$env',
      label: 'Environment',
      children: variables?.data
        .map((v) => {
          return { title: v.name, name: v.name, value: v.name, label: v.name };
        })
        .filter(Boolean),
    };
  }

  return null;
};
