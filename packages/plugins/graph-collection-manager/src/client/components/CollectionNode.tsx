import React from 'react';
import { Graph } from '@antv/x6';
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
  CollectionProvider,
  ResourceActionProvider,
  CollectionManagerProvider,
} from '@nocobase/client';
import '@antv/x6-react-shape';
import { cx } from '@emotion/css';
import { headClass, tableNameClass, tableBtnClass, entityContainer } from '../style';
import { collection } from '../schemas/collection';
import { CollectionNodeProvder } from './CollectionNodeProvder';
import {
  useValuesFromRecord,
  useUpdateCollectionActionAndRefreshCM,
  useCancelAction,
  useDestroyActionAndRefreshCM,
  useDestroyFieldActionAndRefreshCM,
} from '../action-hooks';
import { EditFieldAction } from './EditFieldAction';
import {SourceCollection} from './configrations'



const CollectionNode: React.FC<{
  node?: Node | any;
  graph: Graph | any;
  refreshGraph: () => Promise<void>;
}> = (props) => {
  const { node, graph, refreshGraph } = props;
  const {
    store: {
      data: { title, name, item },
    },
    id,
  } = node;

  return (
    <div className={cx(entityContainer)}>
      <div className={headClass}>
        <span className={tableNameClass}>{title}</span>
        <div className={tableBtnClass}>
          <SchemaComponentProvider>
            <CollectionNodeProvder refresh={refreshGraph}>
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
                <SchemaComponentProvider>
                  <CollectionNodeProvder refresh={refreshGraph} record={item}>
                    <CollectionManagerProvider>
                      <SchemaComponent
                        scope={{ useValuesFromRecord, useUpdateCollectionActionAndRefreshCM, useCancelAction }}
                        components={{
                          Action,
                          EditOutlined,
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
                          SourceCollection
                        }}
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
                    </CollectionManagerProvider>
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
                              useAction: () =>
                                useDestroyFieldActionAndRefreshCM({ name: property.name, collection: item.name }),
                            },
                          },
                        },
                      }}
                    />
                  </CollectionNodeProvder>
                </SchemaComponentProvider>
              </div>
              <div className="name">
                {property.name}
              </div>
              <div className="type">{property.type || property.interface}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionNode;
