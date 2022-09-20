import { PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContext, SchemaComponent, useActionContext } from '../../schema-component';
import { uid } from '@formily/shared';
import { useRequest } from '@nocobase/client';

const useTreeCollectionValues = (options) => {
  const { visible } = useActionContext();
  const result = useRequest(
    () => {
      return Promise.resolve({
        data: {
          name: `t_${uid()}`,
          createdBy: true,
          updatedBy: true,
          sortable: true,
          logging: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
            {
              interface: 'createdAt',
              type: 'date',
              field: 'createdAt',
              name: 'createdAt',
              uiSchema: {
                type: 'datetime',
                title: '{{t("Created at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              interface: 'createdBy',
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'createdById',
              name: 'createdBy',
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
            },
            {
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
            },
            {
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
            },
            {
              type: 'hasMany',
              name: 'children',
              foreignKey: 'parentId',
              sourceKey: 'id',
              targetKey: 'id',
              interface: 'o2m',
              uiSchema: {
                'x-component': 'RecordPicker',
                'x-component-props': {
                  multiple: true,
                  fieldNames: {
                    label: 'id',
                    value: 'id',
                  },
                },
                title: '{{t("Children nodes")}}',
              },
              reverseField: {
                interface: 'm2o',
                type: 'belongsTo',
                uiSchema: {
                  'x-component': 'RecordPicker',
                  'x-component-props': {
                    multiple: false,
                    fieldNames: {
                      label: 'id',
                      value: 'id',
                    },
                  },
                  title: '{{t("Parent node")}}',
                },
              },
            },
          ],
        },
      });
    },
    {
      ...options,
      manual: true,
    },
  );

  useEffect(() => {
    if (visible) {
      result.run();
    }
  }, [visible]);

  return result;
};
const getSchema = (key: string) => {
  const tempSchema = {
    name: uid(),
    type: 'void',
    title: `{{ t("Create ${key}") }}`,
    'x-component': 'Action.Drawer',
    'x-decorator': 'Form',
    'x-decorator-props': {
      useValues: key !== 'treeCollection' ? '{{ useCollectionValues }}' : useTreeCollectionValues,
    },
    properties: {
      title: {
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
      },
      name: {
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        'x-validator': 'uid',
      },
      footer: {
        type: 'void',
        'x-component': 'Action.Drawer.Footer',
        properties: {
          action1: {
            title: '{{ t("Cancel") }}',
            'x-component': 'Action',
            'x-component-props': {
              useAction: '{{ cm.useCancelAction }}',
            },
          },
          action2: {
            title: '{{ t("Submit") }}',
            'x-component': 'Action',
            'x-component-props': {
              type: 'primary',
              useAction: '{{ cm.useCreateActionAndRefreshCM }}',
            },
          },
        },
      },
    },
  };

  if (key === 'treeCollection') {
    tempSchema.properties['treeType'] = {
      'x-component': 'CollectionField',
      default: 'adjacencyList',
      'x-decorator': 'FormItem',
    };
  }
  return tempSchema;
};

export const CreateCollectionAction = () => {
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Dropdown
        overlay={
          <Menu
            style={{
              maxHeight: '60vh',
              overflow: 'auto',
            }}
            onClick={(info) => {
              setSchema(getSchema(info.key));
              setVisible(true);
            }}
          >
            <Menu.Item key="listCollection">{t('List collection')}</Menu.Item>
            <Menu.Item key="treeCollection">{t('Tree collection')}</Menu.Item>
          </Menu>
        }
      >
        <Button icon={<PlusOutlined />} type={'primary'}>
          {t('Create collection')}
        </Button>
      </Dropdown>
      <SchemaComponent schema={schema} />
    </ActionContext.Provider>
  );
};
