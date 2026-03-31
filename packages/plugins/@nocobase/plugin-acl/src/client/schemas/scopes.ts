/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { VariableInput, useFilterOptions, useFormBlockContext } from '@nocobase/client';
import { useContext, useEffect } from 'react';
import { RoleResourceCollectionContext } from '../permissions/RolesResourcesActions';

export const rolesResourcesScopesCollection = {
  name: 'rolesResourcesScopes',
  fields: [
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{t("Scope name")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
  ],
};

const useFormBlockProps = () => {
  const { name } = useContext(RoleResourceCollectionContext);
  const ctx = useFormBlockContext();
  useEffect(() => {
    ctx.form.setInitialValues({
      resourceName: name,
    });
  }, [name]);
  return {
    form: ctx.form,
  };
};

export const scopesSchema: ISchema = {
  type: 'object',
  properties: {
    scope: {
      'x-component': 'RecordPicker',
      'x-component-props': {
        size: 'small',
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        multiple: false,
        association: {
          target: 'rolesResourcesScopes',
        },
        onChange: '{{ onChange }}',
      },
      properties: {
        selector: {
          type: 'void',
          title: '{{ t("Select record") }}',
          'x-component': 'RecordPicker.Selector',
          'x-component-props': {
            className: 'nb-record-picker-selector',
          },
          properties: {
            tableBlock: {
              type: 'void',
              'x-decorator': 'TableSelectorProvider',
              'x-decorator-props': {
                collection: rolesResourcesScopesCollection,
                resource: 'rolesResourcesScopes',
                action: 'list',
                params: {
                  pageSize: 20,
                },
                useParams() {
                  const ctx = useContext(RoleResourceCollectionContext);
                  return {
                    filter: {
                      $or: [{ resourceName: ctx.name }, { resourceName: null }],
                    },
                  };
                },
                rowKey: 'id',
              },
              'x-component': 'BlockItem',
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
                    create: {
                      type: 'void',
                      title: '{{ t("Add new") }}',
                      'x-action': 'create',
                      'x-component': 'Action',
                      'x-component-props': {
                        icon: 'PlusOutlined',
                        openMode: 'drawer',
                        type: 'primary',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("Add record") }}',
                          'x-component': 'Action.Container',
                          'x-component-props': {
                            className: 'nb-action-popup',
                          },
                          properties: {
                            formBlock: {
                              type: 'void',
                              'x-decorator': 'FormBlockProvider',
                              'x-decorator-props': {
                                resource: 'rolesResourcesScopes',
                                collection: rolesResourcesScopesCollection,
                                // useParams: '{{ useParamsFromRecord }}',
                              },
                              'x-component': 'CardItem',
                              properties: {
                                form: {
                                  type: 'void',
                                  'x-component': 'FormV2',
                                  'x-use-component-props': useFormBlockProps,
                                  properties: {
                                    name: {
                                      type: 'string',
                                      'x-component': 'CollectionField',
                                      'x-decorator': 'FormItem',
                                    },
                                    scope: {
                                      type: 'object',
                                      title: '{{t("Data scope")}}',
                                      name: 'filter',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Filter',
                                      'x-use-component-props': () => {
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        const ctx = useContext(RoleResourceCollectionContext);
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        const options = useFilterOptions(ctx.name);
                                        return {
                                          options,
                                        };
                                      },
                                      'x-component-props': {
                                        dynamicComponent: VariableInput,
                                      },
                                    },
                                    actions: {
                                      type: 'void',
                                      'x-component': 'ActionBar',
                                      'x-component-props': {
                                        layout: 'one-column',
                                        style: {
                                          marginTop: 24,
                                        },
                                      },
                                      properties: {
                                        create: {
                                          title: '{{ t("Submit") }}',
                                          'x-action': 'submit',
                                          'x-component': 'Action',
                                          'x-use-component-props': 'useCreateActionProps',
                                          'x-component-props': {
                                            type: 'primary',
                                            htmlType: 'submit',
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
                value: {
                  type: 'array',
                  'x-component': 'TableV2.Selector',
                  'x-use-component-props': 'useTableSelectorProps',
                  'x-component-props': {
                    rowKey: 'id',
                    rowSelection: {
                      type: 'checkbox',
                    },
                  },
                  properties: {
                    column1: {
                      type: 'void',
                      'x-decorator': 'TableV2.Column.Decorator',
                      'x-component': 'TableV2.Column',
                      properties: {
                        name: {
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-read-pretty': true,
                        },
                      },
                    },
                    actions: {
                      type: 'void',
                      title: '{{ t("Actions") }}',
                      'x-action-column': 'actions',
                      'x-component': 'TableV2.Column',
                      properties: {
                        actions: {
                          type: 'void',
                          'x-decorator': 'DndContext',
                          'x-component': 'Space',
                          'x-component-props': {
                            split: '|',
                          },
                          properties: {
                            edit: {
                              type: 'void',
                              title: '{{ t("Edit") }}',
                              'x-action': 'update',
                              'x-decorator': 'ACLActionProvider',
                              'x-component': 'Action.Link',
                              'x-component-props': {
                                openMode: 'drawer',
                              },
                              properties: {
                                drawer: {
                                  type: 'void',
                                  title: '{{ t("Edit record") }}',
                                  'x-component': 'Action.Container',
                                  'x-component-props': {
                                    className: 'nb-action-popup',
                                  },
                                  properties: {
                                    formBlock: {
                                      type: 'void',
                                      'x-decorator': 'FormBlockProvider',
                                      'x-decorator-props': {
                                        resource: 'rolesResourcesScopes',
                                        collection: rolesResourcesScopesCollection,
                                        action: 'get',
                                        useParams: '{{ useParamsFromRecord }}',
                                      },
                                      'x-component': 'CardItem',
                                      properties: {
                                        form: {
                                          type: 'void',
                                          'x-component': 'FormV2',
                                          'x-use-component-props': 'useFormBlockProps',
                                          properties: {
                                            name: {
                                              type: 'string',
                                              'x-component': 'CollectionField',
                                              'x-decorator': 'FormItem',
                                            },
                                            scope: {
                                              type: 'object',
                                              title: '{{t("Data scope")}}',
                                              name: 'filter',
                                              'x-decorator': 'FormItem',
                                              'x-component': 'Filter',
                                              'x-use-component-props': () => {
                                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                                const ctx = useContext(RoleResourceCollectionContext);
                                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                                const options = useFilterOptions(ctx.name);
                                                return {
                                                  options,
                                                };
                                              },
                                              'x-component-props': {
                                                dynamicComponent: VariableInput,
                                              },
                                            },
                                            actions: {
                                              type: 'void',
                                              'x-component': 'ActionBar',
                                              'x-component-props': {
                                                layout: 'one-column',
                                                style: {
                                                  marginTop: 24,
                                                },
                                              },
                                              properties: {
                                                update: {
                                                  title: '{{ t("Submit") }}',
                                                  'x-action': 'submit',
                                                  'x-component': 'Action',
                                                  'x-use-component-props': 'useUpdateActionProps',
                                                  'x-component-props': {
                                                    type: 'primary',
                                                    htmlType: 'submit',
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
                            destroy: {
                              title: '{{ t("Delete") }}',
                              'x-action': 'destroy',
                              'x-decorator': 'ACLActionProvider',
                              'x-component': 'Action.Link',
                              'x-use-component-props': 'useDestroyActionProps',
                              'x-component-props': {
                                icon: 'DeleteOutlined',
                                confirm: {
                                  title: "{{t('Delete record')}}",
                                  content: "{{t('Are you sure you want to delete it?')}}",
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
            footer: {
              'x-component': 'Action.Container.Footer',
              'x-component-props': {},
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'ActionBar',
                  'x-component-props': {},
                  properties: {
                    submit: {
                      title: '{{ t("Submit") }}',
                      'x-action': 'submit',
                      'x-component': 'Action',
                      'x-use-component-props': 'usePickActionProps',
                      'x-component-props': {
                        type: 'primary',
                        htmlType: 'submit',
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
