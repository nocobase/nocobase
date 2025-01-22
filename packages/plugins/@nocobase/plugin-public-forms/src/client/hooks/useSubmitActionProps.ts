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
import {
  useActionContext,
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useDataBlockResource,
  usePlugin,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import PluginPublicFormsClient from '..';

const initialSchema = (values, formSchema, t) => {
  return {
    type: 'void',
    name: uid(),
    'x-decorator': 'PublicFormMessageProvider',
    properties: {
      form: formSchema,
      promptMessage: {
        type: 'void',
        'x-component': 'h3',
        'x-component-props': {
          style: { margin: '10px 0px 10px' },
          children: '{{ t("Prompt after successful submission",{ns:"public-forms"})}}',
        },
      },
      success: {
        type: 'void',
        'x-editable': false,
        'x-toolbar-props': {
          draggable: false,
        },
        'x-settings': 'blockSettings:publicMarkdown',
        'x-component': 'Markdown.Void',
        'x-decorator': 'CardItem',
        'x-component-props': {
          content: t('# Submitted successfully!\nThis is a demo text, **supports Markdown syntax**.'),
        },
        'x-decorator-props': {
          name: 'markdown',
          engine: 'handlebars',
        },
      },
    },
  };
};

export const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const api = useAPIClient();
  const plugin = usePlugin(PluginPublicFormsClient);
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
        const uiSchemaCallback = plugin.getFormSchemaByType(values.type);
        const keys = values.collection.split(':');
        const collection = keys.pop();
        const dataSource = keys.pop() || 'main';
        const schema = initialSchema(
          values,
          uiSchemaCallback({
            collection,
            dataSource,
          }),
          plugin.t.bind(plugin),
        );
        schema['x-uid'] = key;
        await resource.create({
          values: {
            ...values,
            key,
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
