/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import {
  useActionContext,
  useCollection,
  useDataBlockRequest,
  useDataBlockResource,
  usePlugin,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import { useT } from '../locale';
import { PluginBlockTemplateClient } from '..';

export const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const t = useT();
  const { refresh } = useDataBlockRequest();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.update({
        values,
        filterByTk: values[collection.filterTargetKey],
      });
      refresh();
      message.success(t('Saved successfully'));
      plugin.templateInfos.set(values[collection.filterTargetKey], values);
      setVisible(false);
    },
  };
};
