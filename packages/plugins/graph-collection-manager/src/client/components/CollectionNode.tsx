import React from 'react';
import { Graph } from '@antv/x6';
import { uid } from '@formily/shared';
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
import { Dropdown } from 'antd';
import { headClass, tableNameClass, tableBtnClass, entityContainer } from '../style';
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

const CollectionNode: React.FC<{
  node?: Node | any;
  graph: Graph | any;
}> = (props) => {
  const { node, graph } = props;
  const {
    store: {
      data: { title, name, item },
    },
    id,
  } = node;
  const compile = useCompile();
  const { collections = [] } = useCollectionManager();
  const useNewId = (prefix) => {
    return `${prefix || ''}${uid()}`;
  };
  const loadCollections = async (field: any) => {
    return collections?.map((item: any) => ({
      label: compile(item.title),
      value: item.name,
    }));
  };

  return (
    <div className={cx(entityContainer)}>
      <div className={headClass}>
        <span className={tableNameClass}>{title}</span>
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
                        },
                        properties: {
                          drawer: {
                            type: 'void',
                            'x-component': 'Action.Drawer',
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
                        confirm: {
                          title: "{{t('Delete record')}}",
                          content: "{{t('Are you sure you want to delete it?')}}",
                        },
                        useAction: () => useDestroyActionAndRefreshCM({ name, id, graph }),
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
        {item.fields.map((property) => {
          return (
            <div className="body-item" key={property.key} id={property.key}>
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
                  scope={{ useAsyncDataSource, loadCollections, useCancelAction ,useNewId}}
                >
                  <CollectionNodeProvder record={item}>
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
                                collectionName: item.name,
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
                              confirm: {
                                title: "{{t('Delete record')}}",
                                content: "{{t('Are you sure you want to delete it?')}}",
                              },
                              useAction: () =>
                                useDestroyFieldActionAndRefreshCM({ name: property.name, collection: item.name }),
                            },
                          },
                        },
                      }}
                    />
                    <SchemaComponent
                      scope={useCancelAction}
                      schema={{
                        type: 'object',
                        properties: {
                          create: {
                            type: 'void',
                            'x-action': 'create',
                            'x-component': AddFieldAction,
                            'x-component-props': {
                              item: {
                                ...property,
                                collectionName: item.name,
                              },
                            },
                          },
                        },
                      }}
                    />
                  </CollectionNodeProvder>
                </SchemaComponentProvider>
              </div>
              <div className="name">{property.name}</div>
              <div className="type">{property.type || property.interface}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionNode;
