import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  ActionContextProvider,
  SchemaComponent,
  useActionContext,
  useRecord,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { Button, Dropdown, MenuProps } from 'antd';
import React, { useMemo, useState } from 'react';
import { useChartQueryMetadataContext } from '../ChartQueryMetadataProvider';
import { lang } from '../locale';
import { getQueryTypeSchema } from './queryTypes';

const useCreateAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const ctx = useChartQueryMetadataContext();
  return {
    async run() {
      await form.submit();
      await resource.create({ values: form.values });
      setVisible(false);
      await form.reset();
      refresh();
      ctx.refresh();
    },
  };
};

const useUpdateAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  const ctx = useChartQueryMetadataContext();
  return {
    async run() {
      await form.submit();
      await resource.update({ filterByTk, values: form.values });
      setVisible(false);
      await form.reset();
      refresh();
      ctx.refresh();
    },
  };
};

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const getSchema = (initialValue, { form, isNewRecord }) => {
  const type = initialValue.type;
  const schema: ISchema = {
    type: 'void',
    name: uid(),
    'x-component': 'Action.Drawer',
    'x-decorator': 'Form',
    'x-decorator-props': {
      form,
      // initialValue: JSON.parse(JSON.stringify(initialValue)),
    },
    title: isNewRecord ? lang('Add query') : lang('Edit query'),
    properties: {
      title: {
        title: lang('Title'),
        required: true,
        'x-component': 'Input',
        'x-decorator': 'FormItem',
      },
      options: getQueryTypeSchema(type),
      footer: {
        type: 'void',
        'x-component': 'Action.Drawer.Footer',
        properties: {
          cancel: {
            'x-component': 'Action',
            title: lang('Cancel'),
            'x-component-props': {
              useAction: '{{ useCloseAction }}',
            },
          },
          submit: {
            'x-component': 'Action',
            title: lang('Submit'),
            'x-component-props': {
              type: 'primary',
              useAction: '{{ useSubmitAction }}',
            },
          },
        },
      },
    },
  };
  return schema;
};

export const AddNewQuery = () => {
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const form = useMemo(() => createForm(), []);

  const menu = useMemo<MenuProps>(() => {
    return {
      onClick: (info) => {
        setVisible(true);
        form.setValues({ type: info.key });
        setSchema(getSchema({ type: info.key }, { form, isNewRecord: true }));
      },
      items: [
        {
          key: 'json',
          label: 'JSON',
        },
        {
          key: 'sql',
          label: 'SQL',
        },
        {
          key: 'api',
          label: 'API',
          disabled: true,
        },
        {
          key: 'collection',
          label: 'Collection',
          disabled: true,
        },
      ],
    };
  }, [form]);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Dropdown menu={menu}>
        <Button icon={<PlusOutlined />} type={'primary'}>
          {lang('Add query')} <DownOutlined />
        </Button>
      </Dropdown>
      <SchemaComponent schema={schema} scope={{ useCloseAction, useSubmitAction: useCreateAction }} />
    </ActionContextProvider>
  );
};

export const EditQuery = () => {
  const [visible, setVisible] = useState(false);
  const record = useRecord();
  const form = useMemo(() => createForm(), []);
  const schema = getSchema(record, { form, isNewRecord: false });
  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <a
        onClick={() => {
          form.setValues(record);
          setVisible(true);
        }}
      >
        {lang('Edit')}
      </a>
      <SchemaComponent schema={schema} scope={{ useCloseAction, useSubmitAction: useUpdateAction }} />
    </ActionContextProvider>
  );
};
