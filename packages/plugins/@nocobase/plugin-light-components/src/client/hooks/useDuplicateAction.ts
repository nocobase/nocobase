/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
// @ts-ignore
import {
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
} from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { App as AntdApp } from 'antd';
import { useT } from '../locale';

export const useDuplicateAction = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const collection = useCollection();
  const record = useCollectionRecordData();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;

      // Create a copy with new key and title
      const newKey = `lc_${uid()}`;
      await resource.create({
        values: {
          ...record,
          key: newKey,
          title: values.title,
          // Remove id and timestamps to create new record
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        },
      });

      form.reset();
      refresh();
      message.success(t('Light component duplicated successfully'));
      setVisible(false);
    },
  };
};
