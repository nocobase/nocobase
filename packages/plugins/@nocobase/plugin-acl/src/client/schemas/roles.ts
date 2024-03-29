import { uid } from '@formily/shared';
import { useActionContext, useCollectionRecord, useRecord, useRequest } from '@nocobase/client';
import { useEffect } from 'react';
import pick from 'lodash/pick';
import { ISchema } from '@formily/react';

export const roleEditSchema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Action.Drawer',
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues: (options: any) => {
          const record = useRecord();
          const result = useRequest(() => Promise.resolve({ data: pick(record, ['title', 'name', 'default']) }), {
            ...options,
            manual: true,
          });
          const ctx = useActionContext();
          useEffect(() => {
            if (ctx.visible) {
              result.run();
            }
          }, [ctx.visible]);
          return result;
        },
      },
      title: '{{t("Edit role")}}',
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
        default: {
          title: '',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-content': '{{t("Default role")}}',
          'x-reactions': (field) => {
            if (field.initialValue) {
              field.disabled = true;
            } else {
              field.disabled = false;
            }
          },
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            cancel: {
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useCancelAction }}',
              },
            },
            submit: {
              title: '{{t("Submit")}}',
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
};

export const roleCollectionsSchema: ISchema = {
  type: 'void',
  properties: {
    action: {
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
            $and: [{ title: { $includes: '' } }, { name: { $includes: '' } }],
          },
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          'x-component-props': {
            icon: 'FilterOutlined',
            useProps: '{{ useFilterActionProps }}',
          },
          'x-align': 'left',
        },
      },
    },
    table1: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'Table.Void',
      'x-component-props': {
        rowKey: 'name',
        useDataSource: '{{ cm.useDataSourceFromRAC }}',
      },
      properties: {
        column0: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            title: {
              type: 'number',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column2: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            usingConfig: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column4: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'Table.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                configure: {
                  type: 'void',
                  title: '{{t("Configure")}}',
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
                        useValues: '{{ useRoleResourceValues }}',
                      },
                      title: '{{t("Configure permission")}}',
                      properties: {
                        usingActionsConfig: {
                          title: '{{t("Permission policy")}}',
                          'x-component': 'Radio.Group',
                          'x-decorator': 'FormItem',
                          default: false,
                          enum: [
                            { value: false, label: '{{t("General")}}' },
                            { value: true, label: '{{t("Individual")}}' },
                          ],
                          'x-reactions': {
                            target: 'actions',
                            fulfill: {
                              state: {
                                hidden: '{{!$self.value}}',
                              },
                            },
                          },
                        },
                        actions: {
                          'x-component': 'RolesResourcesActions',
                          'x-decorator': 'FormItem',
                        },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            cancel: {
                              title: '{{t("Cancel")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ cm.useCancelAction }}',
                              },
                            },
                            submit: {
                              title: '{{t("Submit")}}',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                useAction: '{{ useSaveRoleResourceAction }}',
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
