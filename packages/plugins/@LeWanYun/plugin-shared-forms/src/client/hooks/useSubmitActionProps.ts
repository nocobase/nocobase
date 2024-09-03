import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  useActionContext,
  useAPIClient,
  useCollection,
  useDataBlockRequest,
  useDataBlockResource,
  usePlugin,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import PluginPublicFormsClient from '..';

const initialSchema = (values, formSchema) => {
  return {
    type: 'void',
    name: uid(),
    properties: {
      form: formSchema,
      success: {
        type: 'void',
        'x-editable': false,
        'x-display': 'none',
        // 'x-display': 1 ? 'visible' : 'none',
        'x-toolbar-props': {
          draggable: false,
        },
        'x-settings': 'blockSettings:markdown',
        'x-component': 'Markdown.Void',
        'x-decorator': 'CardItem',
        'x-component-props': {
          content: '# 提交成功.',
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
  const { runAsync } = useDataBlockRequest();
  const collection = useCollection();
  const api = useAPIClient();
  const plugin = usePlugin(PluginPublicFormsClient);
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
        const keys = values.collection.split('.');
        const collection = keys.pop();
        const dataSource = keys.pop() || 'main';
        const schema = initialSchema(
          values,
          uiSchemaCallback({
            collection,
            dataSource,
          }),
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
      await runAsync();
      message.success('提交成功!');
      setVisible(false);
    },
  };
};
