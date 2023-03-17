import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import * as components from './components';
import { templateOptions } from './templates';

const getSchema = (schema, category, compile): ISchema => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.configurableProperties) as any;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema.default.uiSchema);
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
  }
  const initialValue: any = {
    name: `t_${uid()}`,
    template: schema.name,
    category,
    ...cloneDeep(schema.default),
  };
  if (initialValue.reverseField) {
    initialValue.reverseField.name = `f_${uid()}`;
  }
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: initialValue,
                }),
              options,
            );
          },
        },
        title: '{{ t("Create collection") }}',
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
          // @ts-ignore
          ...properties,
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: () => useCreateCollection(schema),
                },
              },
            },
          },
        },
      },
    },
  };
};

const useDefaultCollectionFields = (values) => {
  let defaults = values.fields ? [...values.fields] : [];
  const { autoGenId = true, createdAt = true, createdBy = true, updatedAt = true, updatedBy = true } = values;
  if (autoGenId) {
    const pk = values.fields.find((f) => f.primaryKey);
    if (!pk) {
      defaults.push({
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
        interface: 'id',
      });
    }
  }
  if (createdAt) {
    defaults.push({
      name: 'createdAt',
      interface: 'createdAt',
      type: 'date',
      field: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    });
  }
  if (createdBy) {
    defaults.push({
      name: 'createdBy',
      interface: 'createdBy',
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'createdById',
      uiSchema: {
        type: 'object',
        title: '{{t("Created by")}}',
        'x-component': 'RecordPicker',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    });
  }
  if (updatedAt) {
    defaults.push({
      type: 'date',
      field: 'updatedAt',
      name: 'updatedAt',
      interface: 'updatedAt',
      uiSchema: {
        type: 'string',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    });
  }
  if (updatedBy) {
    defaults.push({
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'updatedById',
      name: 'updatedBy',
      interface: 'updatedBy',
      uiSchema: {
        type: 'object',
        title: '{{t("Last updated by")}}',
        'x-component': 'RecordPicker',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    });
  }
  // 其他
  return defaults;
};

const useCreateCollection = (schema?: any) => {
  const form = useForm();
  const { refreshCM } = useCollectionManager();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, collection } = useResourceContext();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      if (schema?.events?.beforeSubmit) {
        schema.events.beforeSubmit(values);
      }
      const fields = useDefaultCollectionFields(values);
      if (values.autoCreateReverseField) {
      } else {
        delete values.reverseField;
      }
      delete values.id;
      delete values.autoCreateReverseField;
      await resource.create({
        values: {
          logging: true,
          ...values,
          fields,
        },
      });
      ctx.setVisible(false);
      await form.reset();
      refresh();
      await refreshCM();
    },
  };
};

export const AddCollection = (props) => {
  const record = useRecord();
  return <AddCollectionAction item={record} {...props} />;
};

export const AddCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, trigger, align } = props;
  const { getTemplate } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const { t } = useTranslation();
  const items = templateOptions().map((option) => {
    return { label: compile(option.title), key: option.name };
  });
  const {
    state: { category },
  } = useResourceActionContext();
  return (
    <RecordProvider record={record}>
      <ActionContext.Provider value={{ visible, setVisible }}>
        <Dropdown
          getPopupContainer={getContainer}
          trigger={trigger}
          align={align}
          overlay={
            <Menu
              style={{
                maxHeight: '60vh',
                overflow: 'auto',
              }}
              onClick={(info) => {
                const schema = getSchema(getTemplate(info.key), category, compile);
                setSchema(schema);
                setVisible(true);
              }}
              items={items}
            />
          }
        >
          {children || (
            <Button icon={<PlusOutlined />} type={'primary'}>
              {t('Create collection')} <DownOutlined />
            </Button>
          )}
        </Dropdown>
        <SchemaComponent
          schema={schema}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            useCancelAction,
            createOnly: true,
            useCreateCollection,
            record,
            showReverseFieldConfig: true,
            ...scope,
          }}
        />
      </ActionContext.Provider>
    </RecordProvider>
  );
};
