import { ISchema } from '@formily/react';
import { useContext, useEffect } from 'react';
import { useFormBlockContext, VariableInput, useFilterFieldOptions } from '@nocobase/client';
import { RoleResourceCollectionContext } from '../RolesResourcesActions';

export const rolesResourcesScopesCollection = (dataSourceKey = 'main') => {
  return {
    name: `dataSources/${dataSourceKey}/rolesResourcesScopes`,
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

export const getScopesSchema = (dataSourceKey) => {
  const collection = rolesResourcesScopesCollection(dataSourceKey);
  return {
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
                  collection,
                  resource: `dataSources/${dataSourceKey}/rolesResourcesScopes`,
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
                                  resource: `dataSources/${dataSourceKey}/rolesResourcesScopes`,
                                  collection,
                                },
                                'x-component': 'CardItem',
                                properties: {
                                  form: {
                                    type: 'void',
                                    'x-component': 'FormV2',
                                    'x-component-props': {
                                      useProps: useFormBlockProps,
                                    },
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
                                        'x-component-props': {
                                          dynamicComponent: VariableInput,
                                          useProps() {
                                            const ctx = useContext(RoleResourceCollectionContext);
                                            const options = useFilterFieldOptions(ctx.fields);
                                            return {
                                              options,
                                            };
                                          },
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
                                            'x-component-props': {
                                              type: 'primary',
                                              htmlType: 'submit',
                                              useProps: '{{ useCreateActionProps }}',
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
                    'x-component-props': {
                      rowKey: 'id',
                      rowSelection: {
                        type: 'checkbox',
                      },
                      useProps: '{{ useTableSelectorProps }}',
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
                                  icon: 'EditOutlined',
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
                                          resource: `dataSources/${dataSourceKey}/rolesResourcesScopes`,
                                          collection,
                                          action: 'get',
                                          useParams: '{{ useParamsFromRecord }}',
                                        },
                                        'x-component': 'CardItem',
                                        properties: {
                                          form: {
                                            type: 'void',
                                            'x-component': 'FormV2',
                                            'x-component-props': {
                                              useProps: '{{ useFormBlockProps }}',
                                            },
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
                                                'x-component-props': {
                                                  dynamicComponent: VariableInput,
                                                  useProps() {
                                                    const ctx = useContext(RoleResourceCollectionContext);
                                                    const options = useFilterFieldOptions(ctx.fields);
                                                    return {
                                                      options,
                                                    };
                                                  },
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
                                                    'x-component-props': {
                                                      type: 'primary',
                                                      htmlType: 'submit',
                                                      useProps: '{{ useUpdateActionProps }}',
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
                                'x-component-props': {
                                  icon: 'DeleteOutlined',
                                  confirm: {
                                    title: "{{t('Delete record')}}",
                                    content: "{{t('Are you sure you want to delete it?')}}",
                                  },
                                  useProps: '{{ useDestroyActionProps }}',
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
                        'x-component-props': {
                          type: 'primary',
                          htmlType: 'submit',
                          useProps: '{{ usePickActionProps }}',
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
  } as ISchema;
};
