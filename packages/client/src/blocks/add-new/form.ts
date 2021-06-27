import { uid } from '@formily/shared';

export default () => ({
  type: 'void',
  name: `form_${uid()}`,
  'x-decorator': 'Card',
  'x-component': 'Form',
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      properties: {
        [`gr_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            [`gc_${uid()}`]: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
              },
              properties: {
                [`gb_${uid()}`]: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  properties: {
                    [`gbn_${uid()}`]: {
                      type: 'void',
                      'x-component': 'AddNew.FormItem',
                    },
                  },
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
})