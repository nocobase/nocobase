import { PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, Menu } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import {
  useRequest,
  ActionContext,
  SchemaComponent,
  useCompile,
  useCollectionManager,
  options,
  SourceForeignKey,
  ThroughForeignKey,
  TargetForeignKey,
  SourceKey,
  TargetKey,
} from '@nocobase/client';
import { useCreateAction, SourceCollection, useCancelAction } from '../action-hooks';

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
  const initialValue = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: () => {
            return document.getElementById('graph_container');
          },
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
                  useAction: '{{ createCollectionField }}',
                  record,
                },
              },
            },
          },
        },
      },
    },
  };
};

const useCreateCollectionField = (record) => {
  const form = useForm();
  const title = record.collectionName;
  const { run } = useCreateAction(title, record.key);
  return {
    async run() {
      await form.submit();
      if (['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(form?.values?.interface) && title) {
        form.setValuesIn('reverseField.uiSchema.title', title);
      }
      await run();
    },
  };
};

export const AddFieldAction = ({ item: record }) => {
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        getPopupContainer={() => {
          return document.getElementById('graph_container');
        }}
        overlay={
          <Menu
            style={{
              maxHeight: '60vh',
              overflow: 'auto',
            }}
            onClick={(info) => {
              const schema = getSchema(getInterface(info.key), record, compile);
              setSchema(schema);
              setVisible(true);
            }}
          >
            {options.map((option) => {
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
        <PlusOutlined className="btn-add" />
      </Dropdown>
      <SchemaComponent
        schema={schema}
        components={{
          SourceForeignKey,
          ThroughForeignKey,
          TargetForeignKey,
          SourceKey,
          TargetKey,
          ArrayTable,
          SourceCollection,
        }}
        scope={{ createOnly: true, createCollectionField: () => useCreateCollectionField(record), useCancelAction }}
      />
    </ActionContext.Provider>
  );
};
