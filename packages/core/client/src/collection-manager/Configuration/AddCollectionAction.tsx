import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCancelAction, useCreateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
// import { IField } from './types';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import * as components from './components';
import { options } from './templates';

const getSchema = (schema, record: any, compile): ISchema => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.properties) as any;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema.default.uiSchema);
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
  }
  const initialValue: any = {
    name: `f_${uid()}`,
    template: schema.name,
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
                  useAction: () => useCreateCollection(schema.presetFields),
                },
              },
            },
          },
        },
      },
    },
  };
};

const useDefaltCollectionFields = (fields, values) => {
  return fields?.filter((v) => {
    if (typeof values[v.name] === 'boolean') {
      return values[v.name];
    }
    return true;
  });
};

const useCreateCollection = (defaultFields) => {
  const form = useForm();
  const { refreshCM } = useCollectionManager();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      const fields = useDefaltCollectionFields(defaultFields, values);
      if (values.autoCreateReverseField) {
      } else {
        delete values.reverseField;
      }
      delete values.id;
      delete values.autoCreateReverseField;
      await resource.create({
        values: {
          autoGenId: false,
          logging: true,
          createdAt: false,
          createdBy: false,
          updatedBy: false,
          updatedAt: false,
          sortable: false,
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
                const schema = getSchema(getTemplate(info.key), record, compile);
                setSchema(schema);
                setVisible(true);
              }}
            >
              {options.map((option) => {
                return <Menu.Item key={option.key}>{compile(option.label)}</Menu.Item>;
              })}
            </Menu>
          }
        >
          {children || <Button type={'primary'}>{t('Create collection')}</Button>}
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
