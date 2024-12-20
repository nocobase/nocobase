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
  const { variablesRequest, secretsRequest } = useContext(EnvAndSecretsContext);
  const { data: secrets, loading } = secretsRequest || {};
  const { data: variables, loading: variablesLoading } = variablesRequest || {};
  if (!loading && !variablesLoading && (variables?.data?.length || secrets?.data?.length)) {
    return {
      name: '$env',
      title: 'Environment',
      value: '$env',
      label: 'Environment',
      children: [
        variables?.data?.length && {
          title: 'Variables',
          name: 'vars',
          value: 'vars',
          label: 'Variables',
          children: variables?.data.map((v) => {
            return { title: v.name, name: v.name, value: v.name, label: v.name };
          }),
        },
        secrets?.data?.length && {
          title: 'Secrets',
          name: 'secrets',
          value: 'secrets',
          label: 'Secrets',
          children: secrets?.data.map((v) => {
            return { title: v.name, name: v.name, value: v.name, label: v.name };
          }),
        },
      ].filter(Boolean),
    };
  }

  return null;
};
