/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const createTransportReaction = (transport: 'stdio' | 'remote', required = false) => {
  const condition = transport === 'stdio' ? '{{$deps[0] === "stdio"}}' : '{{["http", "sse"].includes($deps[0])}}';

  return [
    {
      dependencies: ['transport'],
      fulfill: {
        state: {
          visible: condition,
          ...(required ? { required: condition } : {}),
        },
      },
    },
  ];
};

const createMCPFormProperties = (options: {
  disableName?: boolean;
  submitPropsHook: string;
  footerComponent?: 'Action.Drawer.Footer' | 'Action.Drawer.FootBar';
}) => ({
  name: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("Name") }}',
    'x-component': 'Input',
    required: true,
    ...(options.disableName
      ? {
          'x-component-props': {
            disabled: true,
          },
        }
      : {}),
  },
  title: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("Title") }}',
    'x-component': 'Input',
    required: true,
  },
  description: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("Description") }}',
    'x-component': 'Input.TextArea',
    'x-component-props': {
      autoSize: {
        minRows: 2,
        maxRows: 4,
      },
    },
  },
  transport: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("Transport") }}',
    'x-component': 'Select',
    enum: '{{ transportOptions }}',
    required: true,
  },
  command: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("Command") }}',
    'x-component': 'Input',
    'x-component-props': {
      placeholder: '{{ t("For example: npx, uvx, node") }}',
    },
    'x-reactions': createTransportReaction('stdio', true),
  },
  args: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("Arguments") }}',
    'x-component': 'Input',
    'x-component-props': {
      placeholder: '{{ t("Space-separated args, e.g.: -u --flag value") }}',
    },
    'x-reactions': createTransportReaction('stdio'),
  },
  env: {
    type: 'array',
    'x-component': 'ArrayItems',
    'x-decorator': 'FormItem',
    title: '{{ t("Environment variables") }}',
    items: {
      type: 'object',
      properties: {
        space: {
          type: 'void',
          'x-component': 'Space',
          'x-component-props': {
            style: {
              flexWrap: 'nowrap',
              maxWidth: '100%',
              display: 'flex',
            },
            className: '{{ keyValueRowClassName }}',
          },
          properties: {
            name: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{ t("Name") }}',
              },
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'TextAreaWithGlobalScope',
              'x-component-props': {
                useTypedConstant: true,
              },
            },
            remove: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems.Remove',
            },
          },
        },
      },
    },
    properties: {
      add: {
        type: 'void',
        title: '{{ t("Add variable") }}',
        'x-component': 'ArrayItems.Addition',
      },
    },
    'x-reactions': createTransportReaction('stdio'),
  },
  url: {
    type: 'string',
    'x-decorator': 'FormItem',
    title: '{{ t("URL") }}',
    'x-component': 'Input',
    'x-component-props': {
      placeholder: '{{ t("For example: https://example.com/mcp") }}',
    },
    'x-reactions': createTransportReaction('remote', true),
  },
  headers: {
    type: 'array',
    'x-component': 'ArrayItems',
    'x-decorator': 'FormItem',
    title: '{{ t("Headers") }}',
    items: {
      type: 'object',
      properties: {
        space: {
          type: 'void',
          'x-component': 'Space',
          'x-component-props': {
            style: {
              flexWrap: 'nowrap',
              maxWidth: '100%',
              display: 'flex',
            },
            className: '{{ keyValueRowClassName }}',
          },
          properties: {
            name: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{ t("Name") }}',
              },
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'TextAreaWithGlobalScope',
              'x-component-props': {
                useTypedConstant: true,
              },
            },
            remove: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems.Remove',
            },
          },
        },
      },
    },
    properties: {
      add: {
        type: 'void',
        title: '{{ t("Add request header") }}',
        'x-component': 'ArrayItems.Addition',
      },
    },
    'x-reactions': createTransportReaction('remote'),
  },
  restart: {
    type: 'object',
    'x-decorator': 'FormItem',
    title: '{{ t("Restart options") }}',
    'x-component': 'Input.JSON',
    'x-visible': false,
    'x-component-props': {
      autoSize: {
        minRows: 4,
      },
    },
  },
  testResult: {
    type: 'void',
    'x-component': 'TestConnectionResult',
  },
  footer: {
    type: 'void',
    'x-component': options.footerComponent || 'Action.Drawer.Footer',
    properties: {
      test: {
        type: 'void',
        'x-component': 'TestConnectionButton',
      },
      cancel: {
        title: '{{ t("Cancel") }}',
        'x-component': 'Action',
        'x-use-component-props': 'useCancelActionProps',
      },
      submit: {
        title: '{{ t("Submit") }}',
        'x-component': 'Action',
        'x-component-props': {
          type: 'primary',
        },
        'x-use-component-props': options.submitPropsHook,
      },
    },
  },
});

export const createMCPFormContentSchema = {
  type: 'void',
  properties: createMCPFormProperties({ submitPropsHook: 'useCreateActionProps' }),
};

export const editMCPFormContentSchema = {
  type: 'void',
  properties: createMCPFormProperties({
    disableName: true,
    submitPropsHook: 'useEditActionProps',
    footerComponent: 'Action.Drawer.FootBar',
  }),
};

export const viewMCPToolsContentSchema = {
  type: 'void',
  properties: {
    tools: {
      type: 'void',
      'x-component': 'MCPToolsList',
    },
  },
};

export const createMCPSchema = {
  type: 'void',
  properties: {
    createDrawer: {
      type: 'void',
      title: '{{ t("Add new") }}',
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useCreateFormProps',
      properties: createMCPFormContentSchema.properties,
    },
  },
};

export const editMCPDrawerSchema = {
  type: 'void',
  properties: {
    editDrawer: {
      type: 'void',
      title: '{{ t("Edit record") }}',
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useEditFormProps',
      properties: editMCPFormContentSchema.properties,
    },
  },
};

export const viewMCPToolsDrawerSchema = {
  type: 'void',
  properties: {
    viewDrawer: {
      type: 'void',
      title: '{{ t("MCP tools") }}',
      'x-component': 'Action.Drawer',
      'x-component-props': {
        width: 720,
      },
      properties: viewMCPToolsContentSchema.properties,
    },
  },
};

export const mcpSettingsSchema = {
  type: 'void',
  name: 'ai-mcp-clients',
  properties: {
    card: {
      type: 'void',
      'x-component': 'CardItem',
      'x-component-props': {
        heightMode: 'fullHeight',
      },
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'aiMcpClients',
        action: 'list',
        rowKey: 'name',
      },
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            style: {
              marginBottom: 20,
            },
          },
          properties: {
            refresh: {
              title: "{{t('Refresh')}}",
              'x-component': 'Action',
              'x-use-component-props': 'useRefreshActionProps',
              'x-component-props': {
                icon: 'ReloadOutlined',
              },
            },
            bulkDelete: {
              title: "{{t('Delete')}}",
              'x-action': 'destroy',
              'x-component': 'Action',
              'x-use-component-props': 'useMCPBulkDestroyActionProps',
              'x-component-props': {
                icon: 'DeleteOutlined',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            add: {
              type: 'void',
              title: "{{t('Add new')}}",
              'x-align': 'right',
              'x-component': 'AddNew',
            },
          },
        },
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-use-component-props': 'useTableBlockProps',
          'x-component-props': {
            rowKey: 'name',
            rowSelection: {
              type: 'checkbox',
            },
          },
          properties: {
            column1: {
              type: 'void',
              title: '{{ t("Name") }}',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: '{{ t("Title") }}',
              'x-component': 'TableV2.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column4: {
              type: 'void',
              title: '{{ t("Transport") }}',
              'x-component': 'TableV2.Column',
              properties: {
                transport: {
                  type: 'string',
                  'x-component': 'TransportTag',
                },
              },
            },
            column5: {
              type: 'void',
              title: '{{ t("Enabled") }}',
              'x-component': 'TableV2.Column',
              properties: {
                enabled: {
                  type: 'boolean',
                  'x-component': 'EnabledSwitch',
                },
              },
            },
            column6: {
              type: 'void',
              title: '{{ t("Actions") }}',
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
                      title: '{{ t("View") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        openMode: 'drawer',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("MCP tools") }}',
                          'x-component': 'Action.Drawer',
                          'x-component-props': {
                            width: 720,
                          },
                          properties: {
                            content: {
                              type: 'void',
                              'x-component': 'MCPViewDrawerContent',
                            },
                          },
                        },
                      },
                    },
                    edit: {
                      type: 'void',
                      title: '{{ t("Edit") }}',
                      'x-action': 'update',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        openMode: 'drawer',
                      },
                      properties: {
                        drawer: {
                          type: 'void',
                          title: '{{ t("Edit record") }}',
                          'x-component': 'Action.Drawer',
                          'x-decorator': 'FormV2',
                          'x-use-decorator-props': 'useEditFormProps',
                          properties: {
                            content: {
                              type: 'void',
                              'x-component': 'MCPEditDrawerContent',
                            },
                          },
                        },
                      },
                    },
                    destroy: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-action': 'destroy',
                      'x-component': 'Action.Link',
                      'x-use-component-props': 'useMCPDestroyActionProps',
                      'x-component-props': {
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
  },
};
