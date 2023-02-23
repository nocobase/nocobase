import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  ActionContext,
  SchemaComponent,
  useActionContext,
  useRecord,
  useResourceActionContext,
  useResourceContext
} from '@nocobase/client';
import { Button, Dropdown, Menu } from 'antd';
import React, { useMemo, useState } from 'react';
import { getQueryTypeSchema } from './queryTypes';

const useCreateAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      await resource.create({ values: form.values });
      setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

const useUpdateAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      await resource.update({ filterByTk, values: form.values });
      setVisible(false);
      await form.reset();
      refresh();
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
  console.log(initialValue);
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
    title: isNewRecord ? 'Add query' : 'Edit query',
    properties: {
      title: {
        title: 'Title',
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
            title: 'Cancel',
            'x-component-props': {
              useAction: '{{ useCloseAction }}',
            },
          },
          submit: {
            'x-component': 'Action',
            title: 'Submit',
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
  const menu = (
    <Menu
      onClick={(info) => {
        console.log(info.key);
        setVisible(true);
        form.setValues({ type: info.key });
        setSchema(getSchema({ type: info.key }, { form, isNewRecord: true }));
      }}
    >
      <Menu.Item key={'json'}>JSON</Menu.Item>
      <Menu.Item key={'sql'}>SQL</Menu.Item>
      <Menu.Item key={'api'}>API</Menu.Item>
      <Menu.Item disabled>Collection</Menu.Item>
    </Menu>
  );
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown overlay={menu}>
        <Button icon={<PlusOutlined />} type={'primary'}>
          Add new <DownOutlined />
        </Button>
      </Dropdown>
      <SchemaComponent schema={schema} scope={{ useCloseAction, useSubmitAction: useCreateAction }} />
    </ActionContext.Provider>
  );
};

export const EditQuery = () => {
  const [visible, setVisible] = useState(false);
  const record = useRecord();
  const form = useMemo(() => createForm(), []);
  const schema = getSchema(record, { form, isNewRecord: false });
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a
        onClick={() => {
          form.setValues(record);
          setVisible(true);
        }}
      >
        Edit
      </a>
      <SchemaComponent schema={schema} scope={{ useCloseAction, useSubmitAction: useUpdateAction }} />
    </ActionContext.Provider>
  );
};
