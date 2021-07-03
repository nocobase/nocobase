import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';

export default {
  type: 'object',
  properties: {
    [`g_${uid()}`]: {
      type: 'void',
      'x-decorator': 'Card',
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
                      'x-component': 'AddNew',
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
