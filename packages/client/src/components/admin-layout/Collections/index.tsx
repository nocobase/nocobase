import { SchemaRenderer } from '../../../';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FormItem } from '@formily/antd';
import { action } from '@formily/reactive';
import {
  useCollectionContext,
  useCollectionsContext,
} from '../../../constate/Collections';
import { Button, Drawer, Menu, Dropdown, Space } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { uid, isValid, clone } from '@formily/shared';
import { Resource } from '../../../resource';
import { TableRowContext, useTable } from '../../../schemas/table';
import { useRequest } from 'ahooks';
import { VisibleContext } from '../../../context';
import { connect, FormProvider, observer, useForm } from '@formily/react';
import { DescriptionsContext } from '../../../schemas/form';
import { createContext } from 'react';
import { ISchema } from '../../../';
import { createForm, Field } from '@formily/core';
import { SchemaField } from '../../../schemas';
import {
  interfaces,
  options,
} from '../../../schemas/database-field/interfaces';
import { useResourceRequest } from '../../../constate';
import { useTranslation } from 'react-i18next';

export const RoleContext = createContext(null);

function VisibleProvider(props) {
  const ctx = useContext(TableRowContext);
  const [visible, setVisible] = useState(false);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      {props.children}
    </VisibleContext.Provider>
  );
}

const useResource = () => {
  const resource = useResourceRequest('collections');
  return {
    resource,
  };
};

const useCollectionsResource = () => {
  const resource = useResourceRequest('collections');
  return {
    resource,
  };
};

class ActionPermissionResource extends Resource {
  save(options?: any) {
    console.log('ActionPermissionResource.save');
    return Promise.resolve({});
  }
}

const useActionPermissionSubmit = () => {
  const form = useForm();
  const role = useContext(RoleContext);
  const resource = useResourceRequest({
    resourceName: 'roles',
    resourceKey: role.name,
  });
  return {
    async run() {
      await resource.save(form.values);
      console.log('useActionPermissionSubmit', form.values?.actionPermissions);
    },
  };
};

const useActionPermissionResource = ({ onSuccess }) => {
  const role = useContext(RoleContext);
  console.log('RoleContext', role);
  // const { props } = useTable();
  const ctx = useContext(TableRowContext);
  const resource = useResourceRequest(
    {
      resourceName: 'action_permissions',
    },
    ActionPermissionResource,
  );
  const service = useRequest(
    (params?: any) => {
      return resource.list({
        ...params,
        filter: {
          role_name: role.name,
          collection_name: ctx.record.name,
        },
        appends: ['fields'],
      });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess(data) {
        console.log('actionPermissions', data);
        onSuccess({
          actionPermissions: data.map((permission) => {
            const item: any = {};
            Object.keys(permission).forEach((key) => {
              if (isValid(permission[key])) {
                item[key] = permission[key];
              }
            });
            item.fields = permission?.fields.map((field) => field.key) || [];
            return item;
          }),
        });
      },
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

const useDetailsResource = ({ onSuccess }) => {
  const { props } = useTable();
  const ctx = useContext(TableRowContext);
  const resource = useResourceRequest({
    resourceName: 'collections',
    resourceKey: ctx.record[props.rowKey],
  });
  const service = useRequest(
    (params?: any) => {
      return resource.get({ ...params });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

const useFieldsResource = () => {
  const { props } = useTable();
  const ctx = useContext(TableRowContext);
  class FieldResource extends Resource {
    list(options) {
      return super.list({
        ...options,
        filter: { state: 1, collection_name: ctx.record[props.rowKey] },
      });
    }
  }
  const resource = useResourceRequest('fields', FieldResource);
  return {
    resource,
  };
};

const fieldInterfaces = [];
for (const [key, schema] of interfaces) {
  fieldInterfaces.push({
    value: key,
    label: schema.title,
    disabled: schema.disabled,
  });
}

const collectionSchema: ISchema = {
  type: 'array',
  'x-decorator': 'VisibleProvider',
  'x-component': 'Table',
  default: [],
  'x-component-props': {
    rowKey: 'key',
    dragSort: true,
    showIndex: true,
    refreshRequestOnChange: true,
    pagination: {
      pageSize: 100,
    },
    defaultAppends: ['uiSchema'],
    useResource: useFieldsResource,
    collectionName: 'fields',
  },
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      properties: {
        [uid()]: {
          type: 'void',
          name: 'action1',
          title: 'Delete',
          'x-align': 'right',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'destroy',
          },
          'x-component': 'Action',
          'x-component-props': {
            icon: 'DeleteOutlined',
            confirm: {
              title: '删除数据',
              content: '删除后无法恢复，确定要删除吗？',
            },
            useAction: '{{ Table.useTableDestroyAction }}',
          },
        },
        [uid()]: {
          type: 'void',
          title: 'Add New',
          'x-align': 'right',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'create',
          },
          'x-component': 'CreateFieldButton',
          'x-component-props': {
            type: 'primary',
            icon: 'PlusOutlined',
          },
        },
      },
    },
    column1: {
      type: 'void',
      title: '字段名称',
      'x-component': 'Table.Column',
      properties: {
        'uiSchema.title': {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
    column2: {
      type: 'void',
      title: '字段标识',
      'x-component': 'Table.Column',
      properties: {
        name: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
    column3: {
      type: 'void',
      title: '字段类型',
      'x-component': 'Table.Column',
      properties: {
        interface: {
          type: 'string',
          'x-component': 'Select',
          'x-read-pretty': true,
          // @ts-ignore
          enum: fieldInterfaces,
        },
      },
    },
    [uid()]: {
      type: 'void',
      title: '操作',
      'x-component': 'Table.Column',
      'x-component-props': {
        width: 160,
      },
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Action.Group',
          'x-component-props': {
            type: 'link',
          },
          properties: {
            [uid()]: {
              type: 'void',
              title: '编辑',
              'x-component': 'EditFieldButton',
              'x-component-props': {
                type: 'link',
                useAction() {
                  return {
                    async run() {
                      alert('abc');
                    },
                  };
                },
              },
              'x-action-type': 'update',
            },
            [uid()]: {
              type: 'void',
              title: '删除',
              'x-component': 'Action',
              'x-action-type': 'destroy',
              'x-component-props': {
                type: 'link',
                confirm: {
                  title: '删除数据',
                  content: '删除后无法恢复，确定要删除吗？',
                },
                useAction: '{{ Table.useTableDestroyAction }}',
              },
            },
          },
        },
      },
    },
  },
};

function FieldConfigTitle() {
  const ctx = useContext(TableRowContext);
  return <>{`配置「${ctx.record.title}」表字段`}</>;
}

function useCollectionResource({ onSuccess }) {
  const visible = useContext(VisibleContext);
  const resource = useResourceRequest('collections');
  useEffect(() => {
    visible && onSuccess({ name: `t_${uid()}` });
  }, [visible]);
  return { resource };
}

const schema: ISchema = {
  type: 'void',
  name: 'action',
  'x-component': 'Action',
  'x-component-props': {
    tooltip: "{{ t('Collections & Fields') }}",
    className: 'nb-database-config',
    icon: 'DatabaseOutlined',
    type: 'primary',
  },
  properties: {
    modal1: {
      type: 'void',
      title: '数据表配置',
      'x-component': 'Action.Drawer',
      properties: {
        table: {
          type: 'array',
          // 'x-decorator': 'CardItem',
          'x-component': 'Table',
          default: [],
          'x-component-props': {
            rowKey: 'name',
            dragSort: true,
            showIndex: true,
            refreshRequestOnChange: true,
            pagination: {
              pageSize: 100,
            },
            useResource,
            collectionName: 'collections',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Table.ActionBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  name: 'action1',
                  title: '删除',
                  'x-align': 'right',
                  'x-decorator': 'AddNew.Displayed',
                  'x-decorator-props': {
                    displayName: 'destroy',
                  },
                  'x-component': 'Action',
                  'x-component-props': {
                    icon: 'DeleteOutlined',
                    confirm: {
                      title: '删除数据',
                      content: '删除后无法恢复，确定要删除吗？',
                    },
                    useAction: '{{ Table.useTableDestroyAction }}',
                  },
                },
                [uid()]: {
                  type: 'void',
                  title: '创建数据表',
                  'x-align': 'right',
                  'x-decorator': 'AddNew.Displayed',
                  'x-decorator-props': {
                    displayName: 'create',
                  },
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    icon: 'PlusOutlined',
                  },
                  properties: {
                    modal: {
                      type: 'void',
                      title: '创建数据表',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useResource: useCollectionResource,
                      },
                      'x-component': 'Action.Drawer',
                      'x-component-props': {
                        useOkAction: '{{ Table.useTableCreateAction }}',
                      },
                      properties: {
                        title: {
                          type: 'string',
                          title: '数据表名称',
                          'x-component': 'Input',
                          'x-decorator': 'FormilyFormItem',
                        },
                        name: {
                          type: 'string',
                          title: '数据表标识',
                          'x-component': 'Input',
                          'x-decorator': 'FormilyFormItem',
                          description:
                            '随机生成，可修改。支持英文、数字和下划线，必须以英文字母开头',
                        },
                      },
                    },
                  },
                },
              },
            },
            column1: {
              type: 'void',
              title: '数据表名称',
              'x-component': 'Table.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: '数据表标识',
              'x-component': 'Table.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            [uid()]: {
              type: 'void',
              title: '操作',
              'x-component': 'Table.Column',
              'x-component-props': {
                width: 160,
              },
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Action.Group',
                  'x-component-props': {
                    type: 'link',
                  },
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: '配置字段',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'link',
                      },
                      'x-action-type': 'view',
                      properties: {
                        [uid()]: {
                          type: 'void',
                          title: <FieldConfigTitle />,
                          // 'x-decorator': 'RoleProvider',
                          'x-component': 'Action.Drawer',
                          'x-component-props': {},
                          properties: {
                            [uid()]: collectionSchema,
                          },
                        },
                      },
                    },
                    [uid()]: {
                      type: 'void',
                      title: '编辑',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'link',
                      },
                      'x-action-type': 'update',
                      properties: {
                        [uid()]: {
                          type: 'void',
                          title: '编辑数据表',
                          'x-decorator': 'Form',
                          'x-decorator-props': {
                            useResource: useDetailsResource,
                          },
                          'x-component': 'Action.Drawer',
                          'x-component-props': {
                            useOkAction: '{{ Table.useTableUpdateAction }}',
                          },
                          properties: {
                            title: {
                              type: 'string',
                              title: '数据表名称',
                              'x-component': 'Input',
                              'x-decorator': 'FormilyFormItem',
                            },
                          },
                        },
                      },
                    },
                    [uid()]: {
                      type: 'void',
                      title: '删除',
                      'x-component': 'Action',
                      'x-action-type': 'destroy',
                      'x-component-props': {
                        type: 'link',
                        confirm: {
                          title: '删除数据',
                          content: '删除后无法恢复，确定要删除吗？',
                        },
                        useAction: '{{ Table.useTableDestroyAction }}',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function CreateFieldButton() {
  const { t } = useTranslation();
  const { refresh } = useCollectionsContext();
  const ctx = useContext(TableRowContext);
  const { service } = useTable();
  const [visible, setVisible] = useState(false);
  const form = useMemo(() => createForm(), []);
  const [properties, setProperties] = useState({});
  const { collections = [], loading } = useCollectionsContext();
  const resource = useResourceRequest('fields');

  const loadCollections = async (field: any) => {
    return collections.map((item: any) => ({
      label: item.title,
      value: item.name,
    }));
  };

  const loadCollectionFields = async (field: Field) => {
    const target = field.query('....target').get('value');
    const f = field.query('....target').take();
    console.log('loadCollectionFields', f, field);
    const collection = collections?.find((item) => item.name === target);
    if (!collection) {
      return [];
    }
    return collection?.generalFields
      ?.filter((item) => item?.uiSchema?.title)
      ?.map((item) => ({
        label: item?.uiSchema?.title || item.name,
        value: item.name,
      }));
  };

  const menu = (
    <Menu
      onClick={(info) => {
        console.log('click', info.key);
        const schema = interfaces.get(info.key);
        form.setValues({
          ...clone(schema.default),
          collection_name: ctx.record.name,
          key: uid(),
          name: `f_${uid()}`,
          interface: info.key,
        });
        setProperties(clone(schema.properties));
        setVisible(true);
      }}
    >
      {options.map(
        (option, groupIndex) =>
          option.children.length > 0 && (
            <Menu.SubMenu key={groupIndex} title={option.label}>
              {option.children.map((item) => (
                <Menu.Item
                  disabled={item.disabled}
                  style={{ minWidth: 120 }}
                  key={item.name}
                >
                  {item.title}
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          ),
      )}
    </Menu>
  );
  return (
    <>
      <Dropdown overlay={menu} overlayClassName={'all-fields'}>
        <Button type={'primary'} icon={<PlusOutlined />}>
          {t('Add New')} <DownOutlined />
        </Button>
      </Dropdown>
      <Drawer
        title={'添加字段'}
        width={'50%'}
        visible={visible}
        onClose={() => {
          setVisible(false);
          form.reset();
        }}
        footer={
          <Space style={{ float: 'right' }}>
            <Button
              onClick={async () => {
                setVisible(false);
                await form.reset();
              }}
            >
              取消
            </Button>
            <Button
              type={'primary'}
              onClick={async () => {
                await resource.save(form.values);
                setVisible(false);
                await form.reset();
                await service.refresh();
                await refresh();
              }}
            >
              确定
            </Button>
          </Space>
        }
      >
        <FormProvider form={form}>
          <SchemaField
            scope={{
              loadCollections,
              loadCollectionFields,
            }}
            schema={{
              type: 'object',
              properties,
            }}
          />
        </FormProvider>
      </Drawer>
    </>
  );
}

function EditFieldButton() {
  const { refresh, findCollection } = useCollectionsContext();
  const { service } = useTable();
  const ctx = useContext(TableRowContext);
  const [visible, setVisible] = useState(false);
  const form = useMemo(() => createForm(), []);
  const schema = interfaces.get(ctx.record.interface);
  const { collections = [], loading } = useCollectionsContext();
  const resource = useResourceRequest('fields');

  const loadCollections = async (field: any) => {
    return collections.map((item: any) => ({
      label: item.title,
      value: item.name,
    }));
  };

  const loadCollectionFields = async (field: Field) => {
    const target = field.query('....target').get('value');
    const f = field.query('....target').take();
    console.log('loadCollectionFields', f, field);
    const collection = collections?.find((item) => item.name === target);
    if (!collection) {
      return [];
    }
    return collection?.generalFields
      ?.filter((item) => item?.uiSchema?.title)
      ?.map((item) => ({
        label: item?.uiSchema?.title || item.name,
        value: item.name,
      }));
  };
  return (
    <>
      <Button
        type={'link'}
        onClick={() => {
          setVisible(true);
          const collection = findCollection(ctx.record.collection_name);
          const values = collection?.generalFields?.find(
            (field) => field.key === ctx.record.key,
          );
          form.setValues(clone(values || {}));
        }}
      >
        编辑
      </Button>
      <Drawer
        title={'编辑字段'}
        width={'50%'}
        visible={visible}
        onClose={() => setVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button
              onClick={() => {
                setVisible(false);
              }}
            >
              取消
            </Button>
            <Button
              type={'primary'}
              onClick={async () => {
                await resource.save(form.values, {
                  resourceKey: ctx.record.key,
                });
                setVisible(false);
                await service.refresh();
                await refresh();
              }}
            >
              确定
            </Button>
          </Space>
        }
      >
        <FormProvider form={form}>
          <SchemaField
            scope={{
              loadCollections,
              loadCollectionFields,
            }}
            schema={{
              type: 'object',
              properties: clone(schema.properties),
            }}
          />
        </FormProvider>
      </Drawer>
    </>
  );
}

export const Collections = () => {
  return (
    <SchemaRenderer
      components={{
        VisibleProvider,
        CreateFieldButton,
        EditFieldButton,
      }}
      schema={schema}
    />
  );
};

export default Collections;
