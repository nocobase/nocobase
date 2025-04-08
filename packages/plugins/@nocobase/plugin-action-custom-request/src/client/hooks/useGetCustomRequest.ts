/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useRequest } from '@nocobase/client';

export const useGetCustomRequest = () => {
  const fieldSchema = useFieldSchema();
  const requestId = fieldSchema['x-custom-request-id'] || fieldSchema['x-uid'];
  const url = `customRequests:get/${requestId}`;
  return useRequest<{ data: { options: any; title: string; roles: any[] } }>(
    {
      url,
      params: {
        appends: ['roles'],
      },
    },
    {
      manual: true,
      cacheKey: url,
    },
  );
};
