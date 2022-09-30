import React from 'react';
import { Graph } from '@antv/x6';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  SchemaComponent,
  SchemaComponentProvider,
  Action,
  APIClient,
  FormItem,
  CollectionField,
  Form
  
} from '@nocobase/client';
import '@antv/x6-react-shape';
import { headClass, tableNameClass, tableBtnClass } from '../style';
import { collection } from '../schemas/collection';
import { useValuesFromRecord, useUpdateCollectionActionAndRefreshCM, useCancelAction } from '../action-hooks';
const api = new APIClient();

//collection表格
export default class CollectionNode extends React.Component<{ node?: Node | any; graph: Graph }> {
  shouldComponentUpdate() {
    const { node } = this.props;
    if (node) {
      if (node.hasChanged('data')) {
        return true;
      }
    }
    return false;
  }

  render() {
    const { node, graph } = this.props;
    const {
      store: {
        data: { label, item },
      },
      id,
    } = node;
    console.log(this.props);
    const useDestroyAction = () => {
      return {
        async run() {
          await api.request({
            url: `/api/collections:destroy?filterByTk=${label}`,
            method: 'post',
          });
        },
      };
    };
    const useDestroyActionAndRefreshCM = () => {
      const { run } = useDestroyAction();
      return {
        async run() {
          await run();
          graph.removeNode(id);
        },
      };
    };
    return (
      <div className={headClass}>
        <span className={tableNameClass}>{label}</span>
        <div className={tableBtnClass}>
          {/* <EditOutlined
              onClick={() => {
                console.log('table edit ');
              }}
            /> */}

          <SchemaComponentProvider components={{ DeleteOutlined }}>
            <SchemaComponent
              scope={{ useValuesFromRecord, useUpdateCollectionActionAndRefreshCM, useCancelAction }}
              components={{ Action, EditOutlined  }}
              schema={{
                type: 'void',
                properties: {
                  update: {
                    type: 'void',
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
                          useValues: (arg)=>useValuesFromRecord(arg,item) ,
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
                      useAction: useDestroyActionAndRefreshCM,
                    },
                  },
                },
              }}
            />
          </SchemaComponentProvider>
        </div>
      </div>
    );
  }
}
