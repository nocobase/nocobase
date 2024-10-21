/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionProps,
  useCollection,
  useCollectionRecordData,
  useBlockRequestContext,
  useDataBlockResource,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';

export function useDeleteActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { service } = useBlockRequestContext();
  const collection = useCollection();
  return {
    confirm: {
      title: 'Delete',
      content: 'Are you sure you want to delete it?',
    },
    async onClick() {
      if (!collection) {
        throw new Error('collection does not exist');
      }
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
      });
      await service.refresh();
      message.success('Deleted!');
    },
  };
}
