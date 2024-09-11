/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from '../../api-client';

export const useRequestSchema = ({
  uid,
  type = 'getJsonSchema',
  onSuccess,
}: {
  uid: string;
  type?: 'getProperties' | 'getJsonSchema';
  onSuccess?: (data: any) => void;
}) => {
  const conf = {
    url: `/uiSchemas:${type}/${uid}`,
  };
  const { data, loading } = useRequest<{
    data: any;
  }>(conf, {
    refreshDeps: [uid],
    onSuccess(data) {
      onSuccess && onSuccess(data);
    },
  });

  return { schema: data?.data, loading };
};
