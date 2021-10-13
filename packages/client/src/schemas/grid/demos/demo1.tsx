import React from 'react';
import { uid } from '@formily/shared';
import {
  observer,
  FormProvider,
  useFieldSchema,
  RecursionField,
  useField,
} from '@formily/react';
import { ISchema, SchemaRenderer } from '../..';
import { Grid } from '..';

const schema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'Grid',
  'x-component-props': {
    addNewComponent: 'AddNew.CardItem',
  },
  properties: {
    [`row_${uid()}`]: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        [`col_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Col',
          'x-component-props': {
            width: 30,
          },
          properties: {
            [uid()]: {
              type: 'string',
              title: uid(),
              'x-designable-bar': 'FormItem.DesignableBar',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
            [uid()]: {
              type: 'string',
              title: uid(),
              'x-designable-bar': 'FormItem.DesignableBar',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
        [`col_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Col',
          'x-component-props': {
            width: 70,
          },
          properties: {
            [uid()]: {
              type: 'string',
              title: uid(),
              'x-designable-bar': 'FormItem.DesignableBar',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
    [`row_${uid()}`]: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        [`col_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            [uid()]: {
              type: 'string',
              title: uid(),
              'x-designable-bar': 'FormItem.DesignableBar',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
    [`row_${uid()}`]: {
      type: 'void',
      'x-component': 'Grid.Row',
      properties: {
        [`col_${uid()}`]: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            [uid()]: {
              type: 'void',
              name: uid(),
              'x-decorator': 'FormItem',
              'x-designable-bar': 'FormItem.DesignableBar',
              'x-component': 'Card',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid',
                  properties: {
                    [`row_${uid()}`]: {
                      type: 'void',
                      'x-component': 'Grid.Row',
                      'x-component-props': {
                        colsize: [30, 70],
                      },
                      properties: {
                        [`col_${uid()}`]: {
                          type: 'void',
                          'x-component': 'Grid.Col',
                          properties: {
                            [uid()]: {
                              type: 'string',
                              title: uid(),
                              'x-designable-bar': 'FormItem.DesignableBar',
                              'x-decorator': 'FormItem',
                              'x-component': 'Input',
                            },
                          },
                        },
                        [`col_${uid()}`]: {
                          type: 'void',
                          'x-component': 'Grid.Col',
                          properties: {
                            [uid()]: {
                              type: 'string',
                              title: uid(),
                              'x-designable-bar': 'FormItem.DesignableBar',
                              'x-decorator': 'FormItem',
                              'x-component': 'Input',
                            },
                          },
                        },
                      },
                    },
                    [`row_${uid()}`]: {
                      type: 'void',
                      'x-component': 'Grid.Row',
                      properties: {
                        [`col_${uid()}`]: {
                          type: 'void',
                          'x-component': 'Grid.Col',
                          properties: {
                            [uid()]: {
                              type: 'string',
                              title: uid(),
                              'x-designable-bar': 'FormItem.DesignableBar',
                              'x-decorator': 'FormItem',
                              'x-component': 'Input',
                            },
                          },
                        },
                      },
                    },
                    [`row_${uid()}`]: {
                      type: 'void',
                      'x-component': 'Grid.Row',
                      properties: {
                        [`col_${uid()}`]: {
                          type: 'void',
                          'x-component': 'Grid.Col',
                          properties: {
                            [uid()]: {
                              type: 'string',
                              title: uid(),
                              'x-designable-bar': 'FormItem.DesignableBar',
                              'x-decorator': 'FormItem',
                              'x-component': 'Input',
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
};

export default () => {
  return <SchemaRenderer components={{ Grid }} schema={schema} />;
};
