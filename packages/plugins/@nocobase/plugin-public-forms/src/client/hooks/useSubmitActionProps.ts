/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useFlowEngine } from '@nocobase/flow-engine';
import {
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useDataBlockResource,
  usePlugin,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import PluginPublicFormsClient from '..';
import { ensurePublicFormFlowModel } from '../../client-v2/modelTree';

export const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const plugin = usePlugin(PluginPublicFormsClient);
  const flowEngine = useFlowEngine();
  const { service } = useBlockRequestContext();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      if (values[collection.filterTargetKey]) {
        await resource.update({
          values: {
            ...values,
            version: values.version || 'v1',
          },
          filterByTk: values[collection.filterTargetKey],
        });
      } else {
        const key = uid();
        const nextRecord = {
          ...values,
          key,
          type: values.type || 'form',
          version: 'v2',
        };
        await resource.create({
          values: nextRecord,
        });
        await ensurePublicFormFlowModel(flowEngine, nextRecord, plugin.t.bind(plugin));
      }
      form.reset();
      await service.refresh();
      message.success('Saved successfully!');
      setVisible(false);
    },
  };
};
