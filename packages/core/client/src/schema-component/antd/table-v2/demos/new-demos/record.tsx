import { ISchema } from '@formily/react';
import {
  FormBlockProvider,
  Plugin,
  SchemaComponent,
  TableBlockProvider,
  UseDataBlockProps,
  useActionContext,
  useCollectionRecord,
  useDataBlockRequest,
  useDataBlockResource,
  useFormBlockContext,
  useFormBlockProps,
  useTableBlockProps,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { App as AntdApp } from 'antd';
import React from 'react';

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const resource = useDataBlockResource();
  const { run } = useDataBlockRequest();
  const { form } = useFormBlockContext();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = { ...form.values };
      console.log('values', values);

      const { data } = await resource.update(values);
      if (data.data.result === 'ok') {
        message.success('Submit success');
        setVisible(false);
        form.reset();

        // 刷新列表
        run();
      }
    },
  };
};

const useFormBlockProviderProps: UseDataBlockProps<'CollectionGet'> = () => {
  const record = useCollectionRecord<{ id: number }>();
  return {
    collection: 'users',
    action: 'get',
    filterByTk: record.data.id,
  };
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        action: 'list',
        params: {
          pageSize: 2,
        },
        showIndex: true,
        dragSort: false,
      },
      properties: {
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-use-component-props': 'useTableBlockProps',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Username',
              'x-component': 'TableV2.Column',
              properties: {
                username: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            column2: {
              type: 'void',
              title: 'Nickname',
              'x-component': 'TableV2.Column',
              properties: {
                nickname: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
            column3: {
              type: 'void',
              title: 'Actions',
              'x-decorator': 'TableV2.Column.ActionBar',
              'x-component': 'TableV2.Column',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    view: {
                      type: 'void',
                      title: 'View',
                      'x-action': 'view',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        openMode: 'drawer',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: 'View record',
                          'x-component': 'Action.Drawer',
                          'x-component-props': {
                            className: 'nb-action-popup',
                          },
                          properties: {
                            formContext: {
                              type: 'void',
                              'x-decorator': 'FormBlockProvider',
                              'x-use-decorator-props': 'useFormBlockProviderProps',
                              'x-component': 'CardItem',
                              properties: {
                                form: {
                                  type: 'void',
                                  'x-component': 'FormV2',
                                  'x-pattern': 'readPretty',
                                  'x-use-component-props': 'useFormBlockProps',
                                  properties: {
                                    username: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Input',
                                      title: 'Username',
                                      required: true,
                                    },
                                    nickname: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Input',
                                      title: 'Nickname',
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    edit: {
                      type: 'void',
                      title: 'Edit',
                      'x-action': 'update',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        openMode: 'drawer',
                        icon: 'EditOutlined',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: 'Edit record',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'FormBlockProvider',
                          'x-use-decorator-props': 'useFormBlockProviderProps',
                          properties: {
                            formContext: {
                              type: 'void',
                              'x-component': 'div',
                              properties: {
                                form: {
                                  type: 'void',
                                  'x-component': 'FormV2',
                                  'x-use-component-props': 'useFormBlockProps',
                                  properties: {
                                    username: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Input',
                                      title: 'Username',
                                      required: true,
                                    },
                                    nickname: {
                                      type: 'string',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Input',
                                      title: 'Nickname',
                                    },
                                  },
                                },
                              },
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Drawer.Footer',
                              properties: {
                                close: {
                                  title: 'Close',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'default',
                                  },
                                  'x-use-component-props': 'useCloseActionProps',
                                },
                                submit: {
                                  title: 'Submit',
                                  'x-component': 'Action',
                                  'x-use-component-props': 'useSubmitActionProps',
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
          },
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <SchemaComponent schema={schema} scope={{ useSubmitActionProps, useFormBlockProviderProps, useCloseActionProps }} />
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  delayResponse: 500,
  plugins: [DemoPlugin],
  components: {
    TableBlockProvider,
    FormBlockProvider,
  },
  scopes: {
    useTableBlockProps,
    useFormBlockProps,
  },
});

export default app.getRootComponent();
