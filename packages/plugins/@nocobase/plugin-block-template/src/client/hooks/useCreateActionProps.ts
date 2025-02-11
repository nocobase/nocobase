/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { useActionContext, useAPIClient, useDataBlockRequest, useDataBlockResource } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { App as AntdApp } from 'antd';
import { useT } from '../locale';

export const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const api = useAPIClient();
  const { refresh } = useDataBlockRequest();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      const key = values.key;
      const schemaUid = uid();
      const isMobile = values['type'] === 'Mobile';
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
            ...(isMobile
              ? {
                  'x-component-props': {
                    style: {
                      padding: '10px',
                      maxHeight: '100%',
                      overflow: 'scroll',
                    },
                  },
                }
              : {}),
            properties: {
              blocks: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-decorator': 'TemplateGridDecorator',
                'x-component': 'Grid',
                'x-initializer': isMobile ? 'mobile:addBlock' : 'page:addBlock',
                'x-uid': uid(),
                'x-async': false,
                'x-index': 1,
                properties: {},
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
          uid: schemaUid,
        },
      });
      await api.resource('uiSchemas').insert({ values: schema });
      form.reset();
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.values.key = `t_${uid()}`;
    },
  };
};
