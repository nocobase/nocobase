import { ISchema } from '@formily/react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRecord, useResourceActionContext, useResourceContext } from '@nocobase/client';
import { NAMESPACE } from '../locale';
import { triggers } from '../triggers';
import { executionSchema } from './executions';



const collection = {
  name: 'workflows',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Name")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        title: `{{t("Trigger type", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: Array.from(triggers.getEntities()).map(([value, { title }]) => ({
          value,
          label: title,
          color: 'gold'
        })),
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        title: '{{t("Description")}}',
        type: 'string',
        'x-component': 'Input.TextArea',
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'enabled',
      interface: 'radio',
      uiSchema: {
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        enum: [
          { label: `{{t("On", { ns: "${NAMESPACE}" })}}`, value: true, color: '#52c41a' },
          { label: `{{t("Off", { ns: "${NAMESPACE}" })}}`, value: false },
        ],
        'x-component': 'Radio.Group',
        'x-decorator': 'FormItem',
        default: false
      } as ISchema
    },
    {
      type: 'number',
      name: 'allExecuted',
      interface: 'integer',
      uiSchema: {
        title: `{{t("Executed", { ns: "${NAMESPACE}" })}}`,
        type: 'number',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem',
      } as ISchema
    },
  ],
};

export const workflowSchema: ISchema = {
  type: 'void',
  properties: {
    provider: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        resourceName: 'workflows',
        request: {
          resource: 'workflows',
          action: 'list',
          params: {
            pageSize: 50,
            filter: {
              current: true
            },
            sort: ['-enabled', '-createdAt'],
            except: ['config'],
          },
        },
      },
      'x-component': 'CollectionProvider',
      'x-component-props': {
        collection,
      },
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            style: {
              marginBottom: 16,
            },
          },
          properties: {
            delete: {
              type: 'void',
              title: '{{t("Delete")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useBulkDestroyAction }}',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add new")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    initialValue: {
                      current: true
                    }
                  },
                  title: '{{t("Add new")}}',
                  properties: {
                    title: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    type: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    description: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: '{{ t("Cancel") }}',
                          'x-component': 'Action',
                          'x-component-props': {
                            useAction: '{{ cm.useCancelAction }}',
                          },
                        },
                        submit: {
                          title: '{{ t("Submit") }}',
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'primary',
                            useAction: '{{ cm.useCreateAction }}',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }
        },
        table: {
          type: 'void',
          'x-component': 'Table.Void',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useDataSource: '{{ cm.useDataSourceFromRAC }}',
          },
          properties: {
            title: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              }
            },
            type: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                type: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              }
            },
            enabled: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                enabled: {
                  type: 'boolean',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                  default: false
                },
              }
            },
            allExecuted: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                allExecuted: {
                  type: 'number',
                  'x-decorator': 'OpenDrawer',
                  'x-decorator-props': {
                    component: 'a',
                  },
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                  properties: {
                    drawer: executionSchema
                  }
                },
              }
            },
            actions: {
              type: 'void',
              title: '{{ t("Actions") }}',
              'x-component': 'Table.Column',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    config: {
                      type: 'void',
                      'x-component': 'WorkflowLink'
                    },
                    update: {
                      type: 'void',
                      title: '{{ t("Edit") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        type: 'primary',
                      },
                      properties: {
                        modal: {
                          type: 'void',
                          'x-component': 'Action.Modal',
                          'x-decorator': 'Form',
                          'x-decorator-props': {
                            useValues: '{{ cm.useValuesFromRecord }}',
                          },
                          title: '{{ t("Edit") }}',
                          properties: {
                            title: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            enabled: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            description: {
                              'x-component': 'CollectionField',
                              'x-decorator': 'FormItem',
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Modal.Footer',
                              properties: {
                                cancel: {
                                  title: '{{ t("Cancel") }}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    useAction: '{{ cm.useCancelAction }}',
                                  },
                                },
                                submit: {
                                  title: '{{ t("Submit") }}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'primary',
                                    useAction: '{{ cm.useUpdateAction }}',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    revision: {
                      type: 'void',
                      title: `{{t("Duplicate", { ns: "${NAMESPACE}" })}}`,
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        useAction() {
                          const { t } = useTranslation();
                          const { refresh } = useResourceActionContext();
                          const { resource, targetKey } = useResourceContext();
                          const { [targetKey]: filterByTk } = useRecord();
                          return {
                            async run() {
                              await resource.revision({ filterByTk });
                              message.success(t('Operation succeeded'));
                              refresh();
                            },
                          };
                        }
                      }
                    }
                    // delete: {
                    //   type: 'void',
                    //   title: '{{ t("Delete") }}',
                    //   'x-component': 'Action.Link',
                    //   'x-component-props': {
                    //     confirm: {
                    //       title: "{{t('Delete record')}}",
                    //       content: "{{t('Are you sure you want to delete it?')}}",
                    //     },
                    //     useAction: '{{ cm.useDestroyActionAndRefreshCM }}',
                    //   },
                    // },
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
