/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const adminProfileCreateFormSchema = {
  type: 'void',
  'x-uid': 'nocobase-admin-profile-create-form',
  properties: {
    form: {
      type: 'void',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        dataSource: 'main',
      },
      'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
      properties: {
        create: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useCreateFormBlockProps',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'form:configureFields',
              properties: {
                nickname: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        nickname: {
                          type: 'string',
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.nickname',
                        },
                      },
                    },
                  },
                },
                username: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        username: {
                          type: 'string',
                          required: true,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.username',
                        },
                      },
                    },
                  },
                },
                email: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        email: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.email',
                        },
                      },
                    },
                  },
                },
                phone: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        phone: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.phone',
                        },
                      },
                    },
                  },
                },
                password: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        password: {
                          type: 'string',
                          required: true,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.password',
                        },
                      },
                    },
                  },
                },
                roles: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        roles: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.roles',
                        },
                      },
                    },
                  },
                },
              },
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.FootBar',
              properties: {
                cancel: {
                  title: '{{ t("Cancel") }}',
                  'x-component': 'Action',
                  'x-use-component-props': 'useCancelActionProps',
                },
                submit: {
                  title: '{{ t("Submit") }}',
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
};

export const adminProfileEditFormSchema = {
  type: 'void',
  'x-uid': 'nocobase-admin-profile-edit-form',
  properties: {
    form: {
      type: 'void',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        dataSource: 'main',
        action: 'get',
      },
      'x-use-decorator-props': 'useEditFormBlockDecoratorProps',
      properties: {
        edit: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useEditFormBlockProps',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'form:configureFields',
              properties: {
                nickname: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        nickname: {
                          type: 'string',
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.nickname',
                        },
                      },
                    },
                  },
                },
                username: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        username: {
                          type: 'string',
                          required: true,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.username',
                        },
                      },
                    },
                  },
                },
                email: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        email: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.email',
                        },
                      },
                    },
                  },
                },
                phone: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        phone: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.phone',
                        },
                      },
                    },
                  },
                },
                roles: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        roles: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.roles',
                        },
                      },
                    },
                  },
                },
              },
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.FootBar',
              properties: {
                cancel: {
                  title: '{{ t("Cancel") }}',
                  'x-component': 'Action',
                  'x-use-component-props': 'useCancelActionProps',
                },
                submit: {
                  title: '{{ t("Submit") }}',
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
};

export const userProfileEditFormSchema = {
  type: 'void',
  'x-uid': 'nocobase-user-profile-edit-form',
  properties: {
    form: {
      type: 'void',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        dataSource: 'main',
        action: 'get',
      },
      'x-use-decorator-props': 'useEditFormBlockDecoratorProps',
      properties: {
        edit: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useEditFormBlockProps',
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'form:configureFields',
              properties: {
                nickname: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        nickname: {
                          type: 'string',
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.nickname',
                        },
                      },
                    },
                  },
                },
                username: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        username: {
                          type: 'string',
                          required: true,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.username',
                        },
                      },
                    },
                  },
                },
                email: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        email: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.email',
                        },
                      },
                    },
                  },
                },
                phone: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        phone: {
                          type: 'string',
                          required: false,
                          'x-toolbar': 'FormItemSchemaToolbar',
                          'x-settings': 'fieldSettings:FormItem',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {},
                          'x-collection-field': 'users.phone',
                        },
                      },
                    },
                  },
                },
              },
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.FootBar',
              properties: {
                cancel: {
                  title: '{{ t("Cancel") }}',
                  'x-component': 'Action',
                  'x-use-component-props': 'useCancelActionProps',
                },
                submit: {
                  title: '{{ t("Submit") }}',
                  'x-component': 'Action',
                  'x-use-component-props': 'useUpdateProfileActionProps',
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
};
