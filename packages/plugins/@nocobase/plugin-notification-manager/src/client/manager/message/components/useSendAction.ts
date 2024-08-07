/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionRecord, useResourceActionContext, useAPIClient } from '@nocobase/client';
export function useSendAction() {
  const { data }: any = useCollectionRecord();

  const apiClient = useAPIClient();
  return {
    async run() {
      await apiClient.request({
        url: 'messages:send',
        method: 'post',
        data: {
          id: data.id,
        },
      });
    },
  };
}
