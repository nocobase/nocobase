import { uid } from '@formily/shared';

const schema = {
  type: 'object',
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Form',
      properties: {
        [uid()]: {
          type: 'void',
          'x-decorator': 'Card',
          'x-component': 'Grid',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',

                  properties: {
                    [uid()]: {
                      type: 'string',
                      required: true,
                      title: '字段1',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'string',
                      required: true,
                      title: '字段2',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
            [uid()]: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {

                    [uid()]: {
                      type: 'string',
                      required: true,
                      title: '字段3',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'string',
                      required: true,
                      title: '字段4',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
            [uid()]: {
              type: 'void',
              'x-component': 'Grid.Row',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid.Col',
                  properties: {
                    [uid()]: {
                      type: 'string',
                      required: true,
                      title: '字段5',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                },
              },
            },
          },
        },
        actions: {
          type: 'void',
          // 'x-decorator': 'Div',
          'x-component': 'Space',
          properties: {
            submit: {
              type: 'void',
              'x-component': 'Action',
              'x-component-props': {
                // block: true,
                type: 'primary',
                useAction: '{{ useLogin }}',
                style: {
                  // width: '100%',
                },
              },
              title: '提交',
            },
            reset: {
              type: 'void',
              'x-component': 'Action',
              'x-component-props': {
                // block: true,
                useAction: '{{ useLogin }}',
                style: {
                  // width: '100%',
                },
              },
              title: '重置',
            },
          },
        },
      },
    },
  },
};

export default schema;
