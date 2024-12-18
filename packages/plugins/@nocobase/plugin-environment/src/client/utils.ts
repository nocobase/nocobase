/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '@nocobase/client';

export const useGetEnvironmentVariables = () => {
  const { data: secrets, loading } = useRequest<{
    data: any[];
  }>({
    resource: 'environmentSecrets',
    action: 'list',
  });
  const { data: variables, loading: variablesLoading } = useRequest<{
    data: any[];
  }>({
    resource: 'environmentVariables',
    action: 'list',
  });

  if (!loading && !variablesLoading && (variables?.data?.length || secrets?.data?.length)) {
    return {
      name: '$environment',
      title: 'Environment',
      children: [
        variables?.data?.length && {
          title: 'Variables',
          name: 'variables',
          children: variables?.data.map((v) => {
            return { title: v.name, name: v.name };
          }),
        },
        secrets?.data?.length && {
          title: 'Secrets',
          name: 'secrets',
          children: secrets?.data.map((v) => {
            return { title: v.name, name: v.name };
          }),
        },
      ].filter(Boolean),
    };
  }

  return null;
};
