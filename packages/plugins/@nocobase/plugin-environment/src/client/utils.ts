/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest, useBaseVariable } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

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

  if (!loading && !variablesLoading) {
    return {
      name: '$environment',
      title: 'Environment',
      children: [
        {
          title: 'Variables',
          name: 'variables',
          children: variables?.data.map((v) => {
            return { title: v.name, name: v.name };
          }),
        },
        {
          title: 'Secrets',
          name: 'secrets',
          children: secrets?.data.map((v) => {
            return { title: v.name, name: v.name };
          }),
        },
      ],
    };
  }

  return null;
};
