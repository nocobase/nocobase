/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { useDataBlockResource } from '@nocobase/client';
import { App as AntdApp } from 'antd';

// TODO：这里暂时只实现了基本流程，更多参考内核 @nocobase/client 的 useCreateActionProps
export const usePublicSubmitActionProps = () => {
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.publicSubmit({
        values,
      });
      await form.reset();
      message.success('Saved successfully!');
    },
  };
};
