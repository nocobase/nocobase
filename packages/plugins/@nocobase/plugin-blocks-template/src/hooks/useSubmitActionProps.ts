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
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useDataBlockResource,
} from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { App as AntdApp } from 'antd';

export const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const api = useAPIClient();
  const { service } = useBlockRequestContext();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      if (values[collection.filterTargetKey]) {
        await resource.update({
          values,
          filterByTk: values[collection.filterTargetKey],
        });
      } else {
        const key = uid();
        // const keys = values.collection.split(':');
        // const collection = keys.pop();
        // const dataSource = keys.pop() || 'main';
        // const schema = initialSchema(
        //   values,
        //   uiSchemaCallback({
        //     collection,
        //     dataSource,
        //   }),
        // );
        // schema['x-uid'] = key;

        const schemaUid = uid();
        const schema = {
          type: 'void',
          name: key,
          'x-uid': `template-${schemaUid}`,
          _isJSONSchemaObject: true,
          properties: {
            template: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'div',
              properties: {
                [uid()]: {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'page:addBlock',
                  'x-uid': uid(),
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': schemaUid,
              'x-async': true,
              'x-index': 1,
            },
          },
        };
        await resource.create({
          values: {
            ...values,
            key,
            uid: schemaUid,
            // schema,
          },
        });
        await api.resource('uiSchemas').insert({ values: schema });
      }
      form.reset();
      await service.refresh();
      message.success('Saved successfully!');
      setVisible(false);
    },
  };
};
