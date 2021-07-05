import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';

export default {
  type: 'object',
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
                  type: 'void',
                  'x-component': 'AddNew.BlockItem',
                },
              },
            },
          },
        },
      },
    },
  },
} as ISchema;
