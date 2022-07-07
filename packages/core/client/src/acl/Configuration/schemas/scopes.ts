import { ISchema } from '@formily/react';
import { useContext, useEffect } from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { useFilterOptions } from '../../../schema-component';
import { RoleResourceCollectionContext } from '../RolesResourcesActions';

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
                                        useProps() {
                                          const ctx = useContext(RoleResourceCollectionContext);
                                          const options = useFilterOptions(ctx.name);
                                          console.log('ctx.name', ctx.name, options);
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
                                                useProps() {
                                                  const ctx = useContext(RoleResourceCollectionContext);
                                                  const options = useFilterOptions(ctx.name);
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
                              'x-component': 'Action.Link',
                              'x-designer': 'Action.Designer',
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
                      'x-designer': 'Action.Designer',
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
};
