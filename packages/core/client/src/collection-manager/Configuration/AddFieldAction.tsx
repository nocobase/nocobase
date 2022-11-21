import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCancelAction, useCreateAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { IField } from '../interfaces/types';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import * as components from './components';
import { getOptions } from './interfaces';

const getSchema = (schema: IField, record: any, compile) => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.properties) as any;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema?.default?.uiSchema);
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
  }

  const initialValue: any = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  if (initialValue.reverseField) {
    initialValue.reverseField.name = `f_${uid()}`;
  }
  // initialValue.uiSchema.title = schema.title;
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
        title: `${compile(record.title)} - ${compile('{{ t("Add field") }}')}`,
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
                  useAction: '{{ useCreateCollectionField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

export const useCollectionFieldFormValues = () => {
  const form = useForm();
  return {
    getValues() {
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
      } else {
        delete values.reverseField;
      }
      delete values.autoCreateReverseField;
      return values;
    },
  };
};

const useCreateCollectionField = () => {
  const form = useForm();
  const { run } = useCreateAction();
  const { refreshCM } = useCollectionManager();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      if (values.autoCreateReverseField) {
      } else {
        delete values.reverseField;
      }
      delete values.autoCreateReverseField;
      await resource.create({ values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
      await refreshCM();
    },
  };
};

export const AddCollectionField = (props) => {
  const record = useRecord();
  return <AddFieldAction item={record} {...props} />;
};

export const AddFieldAction = (props) => {
  const { scope, getContainer, item: record, children, trigger, align } = props;
  const { getInterface } = useCollectionManager();
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
                const schema = getSchema(getInterface(info.key), record, compile);
                if (schema) {
                  setSchema(schema);
                  setVisible(true);
                }
              }}
            >
              {getOptions().map((option) => {
                return (
                  option.children.length > 0 && (
                    <Menu.ItemGroup key={option.label} title={compile(option.label)}>
                      {option.children
                        .filter((child) => !['o2o', 'subTable'].includes(child.name))
                        .map((child) => {
                          return <Menu.Item key={child.name}>{compile(child.title)}</Menu.Item>;
                        })}
                    </Menu.ItemGroup>
                  )
                );
              })}
            </Menu>
          }
        >
          {children || (
            <Button icon={<PlusOutlined />} type={'primary'}>
              {t('Add field')}
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
            useCreateCollectionField,
            record,
            showReverseFieldConfig: true,
            ...scope,
          }}
        />
      </ActionContext.Provider>
    </RecordProvider>
  );
};
