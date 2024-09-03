export const editActionSchema = {
  type: 'void',
  title: 'Edit',
  'x-component': 'Action.Link',
  'x-component-props': {
    openMode: 'drawer',
    icon: 'EditOutlined',
  },
  properties: {
    drawer: {
      type: 'void',
      title: '编辑',
      'x-component': 'Action.Drawer',
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useEditFormProps',
          properties: {
            title: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            description: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            password: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            enabled: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Drawer.Footer',
              properties: {
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
};
