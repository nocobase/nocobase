import React from 'react';
import { uid } from '@formily/shared';
import { css } from '@emotion/css';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  SchemaComponent,
  SchemaComponentProvider,
  Action,
  FormItem,
  CollectionField,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
  Radio,
  Grid,
  useCompile,
  CollectionProvider,
  ResourceActionProvider,
  useCollectionManager,
} from '@nocobase/client';
import '@antv/x6-react-shape';
import { cx } from '@emotion/css';
import { Dropdown, Popover, Tag } from 'antd';
import { headClass, tableNameClass, tableBtnClass, entityContainer, collectiionPopoverClass } from '../style';
import { collection } from '../schemas/collection';
import { CollectionNodeProvder } from './CollectionNodeProvder';
import {
  useValuesFromRecord,
  useUpdateCollectionActionAndRefreshCM,
  useCancelAction,
  useDestroyActionAndRefreshCM,
  useDestroyFieldActionAndRefreshCM,
  useAsyncDataSource,
} from '../action-hooks';
import { EditFieldAction } from './EditFieldAction';
import { AddFieldAction } from './AddFieldAction';
import { FieldSummary } from './FieldSummary';

const Entity: React.FC<{
  node?: Node | any;
}> = (props) => {
  const { node } = props;
  const {
    store: {
      data: { title, name, item, ports,attrs },
    },
    id,
  } = node;
  const compile = useCompile();
  const { collections = [], getInterface } = useCollectionManager();
  const useNewId = (prefix) => {
    return `${prefix || ''}${uid()}`;
  };
  const loadCollections = async (field: any) => {
    return collections?.map((item: any) => ({
      label: compile(item.title),
      value: item.name,
    }));
  };
  const CollectionConten = (data) => {
    const { type, name, primaryKey, allowNull, autoIncrement } = data;
    return (
      <div className={cx(collectiionPopoverClass)}>
        <div className="field-content">
          <div>
            <span>name</span>: <span className="field-type">{name}</span>
          </div>
          <div>
            <span>type</span>: <span className="field-type">{type}</span>
          </div>
        </div>
        <p>
          {primaryKey && <Tag color="green">PRIMARY</Tag>}
          {allowNull && <Tag color="geekblue">ALLOWNULL</Tag>}
          {autoIncrement && <Tag color="purple">AUTOINCREMENT</Tag>}
        </p>
      </div>
    );
  };
  return (
    <div className={cx(entityContainer)} style={{borderColor:attrs?.border}}>
      <div className={headClass}>
        <span className={tableNameClass}>{compile(title)}</span>
        <div className={tableBtnClass}>
          <SchemaComponentProvider>
            <CollectionNodeProvder>
              <CollectionProvider collection={collection}>
                <SchemaComponent
                  scope={{ useValuesFromRecord, useUpdateCollectionActionAndRefreshCM, useCancelAction }}
                  components={{ Action, EditOutlined, FormItem, CollectionField, Input, Form }}
                  schema={{
                    type: 'object',
                    properties: {
                      update: {
                        type: 'void',
                        title: '{{ t("Edit collection") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          component: EditOutlined,
                          className: css`
                            border-color: transparent;
                            color: rgb(78 89 105);
                            height: 20px;
                            width: 22px;
                            margin: 0px 5px 4px;
                            line-height: 25px;
                            &:hover {
                              background-color: rgb(229 230 235);
                            }
                          `,
                        },
                        properties: {
                          drawer: {
                            type: 'void',
                            'x-component': 'Action.Drawer',
                            'x-component-props': {
                              getContainer: () => {
                                return document.getElementById('graph_container');
                              },
                            },
                            'x-decorator': 'Form',
                            'x-decorator-props': {
                              useValues: (arg) => useValuesFromRecord(arg, item),
                            },
                            title: '{{ t("Edit collection") }}',
                            properties: {
                              title: {
                                'x-component': 'CollectionField',
                                'x-decorator': 'FormItem',
                              },
                              name: {
                                'x-component': 'CollectionField',
                                'x-decorator': 'FormItem',
                                'x-disabled': true,
                              },
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
                                      useAction: '{{ useUpdateCollectionActionAndRefreshCM }}',
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  }}
                />
              </CollectionProvider>
              <SchemaComponent
                components={{ Action, DeleteOutlined }}
                schema={{
                  type: 'void',
                  properties: {
                    action: {
                      type: 'void',
                      'x-action': 'destroy',
                      'x-component': 'Action',
                      'x-component-props': {
                        component: DeleteOutlined,
                        icon: 'DeleteOutlined',
                        className: css`
                          background-color: rgb(255 236 232);
                          border-color: transparent;
                          color: #e31c1c;
                          height: 20px;
                          padding: 5px;
                          &:hover {
                            background-color: rgb(253 205 197);
                          }
                        `,

                        confirm: {
                          title: "{{t('Delete record')}}",
                          getContainer: () => {
                            return document.getElementById('graph_container');
                          },
                          collectionConten: "{{t('Are you sure you want to delete it?')}}",
                        },
                        useAction: () => useDestroyActionAndRefreshCM({ name, id }),
                      },
                    },
                  },
                }}
              />
            </CollectionNodeProvder>
          </SchemaComponentProvider>
        </div>
      </div>
      <div className="body">
        {ports.items.map((property) => {
          return (
            property.uiSchema && (
              <Popover
                content={CollectionConten(property)}
                getPopupContainer={() => {
                  return document.getElementById('graph_container');
                }}
                mouseLeaveDelay={0}
                zIndex={100}
                title={
                  <div>
                    {compile(property.uiSchema?.title)}
                    <span style={{ color: '#ffa940', float: 'right' }}>
                      {compile(getInterface(property.interface).title)}
                    </span>
                  </div>
                }
                key={property.id}
                placement="right"
              >
                <div className="body-item" key={property.id} id={property.id}>
                  <div className="field-operator">
                    <SchemaComponentProvider
                      components={{
                        FormItem,
                        CollectionField,
                        Input,
                        Form,
                        ResourceActionProvider,
                        Select,
                        Checkbox,
                        Radio,
                        InputNumber,
                        Grid,
                        FieldSummary,
                        Action,
                        EditOutlined,
                        DeleteOutlined,
                        AddFieldAction,
                        Dropdown,
                      }}
                      scope={{ useAsyncDataSource, loadCollections, useCancelAction, useNewId }}
                    >
                      <CollectionNodeProvder record={item}>
                        <SchemaComponent
                          scope={useCancelAction}
                          schema={{
                            type: 'object',
                            properties: {
                              create: {
                                type: 'void',
                                'x-action': 'create',
                                'x-component': 'AddFieldAction',
                                'x-component-props': {
                                  item: {
                                    ...property,
                                  },
                                  node,
                                },
                              },
                            },
                          }}
                        />
                        <SchemaComponent
                          scope={{ useValuesFromRecord, useUpdateCollectionActionAndRefreshCM, useCancelAction }}
                          schema={{
                            type: 'object',
                            properties: {
                              update: {
                                type: 'void',
                                'x-action': 'update',
                                'x-component': EditFieldAction,
                                'x-component-props': {
                                  item: {
                                    ...property,
                                  },
                                },
                              },
                            },
                          }}
                        />
                        <SchemaComponent
                          schema={{
                            type: 'void',
                            properties: {
                              action: {
                                type: 'void',
                                'x-action': 'destroy',
                                'x-component': 'Action',
                                'x-component-props': {
                                  component: DeleteOutlined,
                                  icon: 'DeleteOutlined',
                                  className: css`
                                    background-color: rgb(255 236 232);
                                    border-color: transparent;
                                    color: #e31c1c;
                                    height: 20px;
                                    width: 20px;
                                    padding: 5px;
                                    &:hover {
                                      background-color: rgb(253 205 197);
                                    }
                                  `,
                                  confirm: {
                                    title: "{{t('Delete record')}}",
                                    getContainer: () => {
                                      return document.getElementById('graph_container');
                                    },
                                    collectionConten: "{{t('Are you sure you want to delete it?')}}",
                                  },
                                  useAction: () =>
                                    useDestroyFieldActionAndRefreshCM({
                                      collectionName: property.collectionName,
                                      name: property.name,
                                      portId: property.id,
                                      node,
                                    }),
                                },
                              },
                            },
                          }}
                        />
                      </CollectionNodeProvder>
                    </SchemaComponentProvider>
                  </div>
                  <div className="name">{compile(property.uiSchema?.title)}</div>
                  <div className="type">{compile(getInterface(property.interface).title)}</div>
                </div>
              </Popover>
            )
          );
        })}
      </div>
    </div>
  );
};

export default Entity;
