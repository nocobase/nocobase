import { ISchema, useForm } from '@formily/react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useActionContext, useRecord, useResourceActionContext, useResourceContext } from '@nocobase/client';
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
          color: 'gold',
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
      interface: 'radioGroup',
      uiSchema: {
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        enum: [
          { label: `{{t("On", { ns: "${NAMESPACE}" })}}`, value: true, color: '#52c41a' },
          { label: `{{t("Off", { ns: "${NAMESPACE}" })}}`, value: false },
        ],
        'x-component': 'Radio.Group',
        'x-decorator': 'FormItem',
        default: false,
      } as ISchema,
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
      } as ISchema,
    },
    {
      type: 'object',
      name: 'options',
    },
  ],
};

const workflowFieldset = {
  title: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  type: {
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
  options: {
    type: 'object',
    'x-component': 'fieldset',
    properties: {
      // NOTE: not to expose this option for now, because hard to track errors
      // useTransaction: {
      //   type: 'boolean',
      //   title: `{{ t("Use transaction", { ns: "${NAMESPACE}" }) }}`,
      //   description: `{{ t("Data operation nodes in workflow will run in a same transaction until any interruption. Any failure will cause data rollback, and will also rollback the history of the execution.", { ns: "${NAMESPACE}" }) }}`,
      //   'x-decorator': 'FormItem',
      //   'x-component': 'Checkbox',
      // },
      deleteExecutionOnStatus: {
        type: 'array',
        title: `{{ t("Auto delete history when execution is on end status", { ns: "${NAMESPACE}" }) }}`,
        'x-decorator': 'FormItem',
        'x-component': 'ExecutionStatusSelect',
        'x-component-props': {
          multiple: true,
        },
      },
    },
  },
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
            pageSize: 20,
            filter: {
              current: true,
            },
            sort: ['-createdAt'],
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
            filter: {
              type: 'void',
              title: '{{ t("Filter") }}',
              default: {
                $and: [{ title: { $includes: '' } }],
              },
              'x-action': 'filter',
              'x-component': 'Filter.Action',
              'x-component-props': {
                icon: 'FilterOutlined',
                useProps: '{{ cm.useFilterActionProps }}',
              },
              'x-align': 'left',
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
                      current: true,
                    },
                  },
                  title: '{{t("Add new")}}',
                  properties: {
                    title: workflowFieldset.title,
                    type: workflowFieldset.type,
                    description: workflowFieldset.description,
                    options: workflowFieldset.options,
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
            sync: {
              type: 'void',
              title: `{{t("Sync", { ns: "${NAMESPACE}" })}}`,
              'x-decorator': 'Tooltip',
              'x-decorator-props': {
                title: `{{ t("Sync enabled status of all workflows from database", { ns: "${NAMESPACE}" }) }}`,
              },
              'x-component': 'Action',
              'x-component-props': {
                useAction() {
                  const { t } = useTranslation();
                  const { resource } = useResourceContext();
                  return {
                    async run() {
                      await resource.sync();
                      message.success(t('Operation succeeded'));
                    },
                  };
                },
              },
            },
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
          },
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
              },
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
              },
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
                  default: false,
                },
              },
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
                    drawer: executionSchema,
                  },
                },
              },
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
                    view: {
                      type: 'void',
                      'x-component': 'WorkflowLink',
                    },
                    update: {
                      type: 'void',
                      title: '{{ t("Edit") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        type: 'primary',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'Form',
                          'x-decorator-props': {
                            useValues: '{{ cm.useValuesFromRecord }}',
                          },
                          title: '{{ t("Edit") }}',
                          properties: {
                            title: workflowFieldset.title,
                            enabled: workflowFieldset.enabled,
                            description: workflowFieldset.description,
                            options: workflowFieldset.options,
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
                        openSize: 'small',
                      },
                      properties: {
                        modal: {
                          type: 'void',
                          title: `{{t("Duplicate to new workflow", { ns: "${NAMESPACE}" })}}`,
                          'x-decorator': 'FormV2',
                          'x-component': 'Action.Modal',
                          properties: {
                            title: {
                              type: 'string',
                              title: '{{t("Title")}}',
                              'x-decorator': 'FormItem',
                              'x-component': 'Input',
                            },
                            footer: {
                              type: 'void',
                              'x-component': 'Action.Modal.Footer',
                              properties: {
                                submit: {
                                  type: 'void',
                                  title: '{{t("Submit")}}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    type: 'primary',
                                    useAction() {
                                      const { t } = useTranslation();
                                      const { refresh } = useResourceActionContext();
                                      const { resource, targetKey } = useResourceContext();
                                      const { setVisible } = useActionContext();
                                      const { [targetKey]: filterByTk } = useRecord();
                                      const { values } = useForm();
                                      return {
                                        async run() {
                                          await resource.revision({ filterByTk, values });
                                          message.success(t('Operation succeeded'));
                                          refresh();
                                          setVisible(false);
                                        },
                                      };
                                    },
                                  },
                                },
                                cancel: {
                                  type: 'void',
                                  title: '{{t("Cancel")}}',
                                  'x-component': 'Action',
                                  'x-component-props': {
                                    useAction: '{{ cm.useCancelAction }}',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        confirm: {
                          title: "{{t('Delete record')}}",
                          content: "{{t('Are you sure you want to delete it?')}}",
                        },
                        useAction: '{{ cm.useDestroyActionAndRefreshCM }}',
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
