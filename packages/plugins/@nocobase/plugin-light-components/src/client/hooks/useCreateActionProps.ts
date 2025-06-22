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
import { useActionContext, useDataBlockRequest, useDataBlockResource } from '@nocobase/client';
import { uid } from '@formily/shared';
import { App as AntdApp } from 'antd';
import { useT } from '../locale';

export const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;

      // Generate unique key if not provided
      if (!values.key) {
        values.key = `lc_${uid()}`;
      }

      await resource.create({
        values: {
          ...values,
          template: values.template || '',
          flows: values.flows || [],
        },
      });

      form.reset();
      refresh();
      message.success(t('Light component created successfully'));
      setVisible(false);
    },
  };
};
