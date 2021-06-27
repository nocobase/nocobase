import React from 'react';
import { SchemaBlock } from '../../';
import { ISchema } from '@formily/json-schema';

const schema: ISchema = {
  type: 'object',
  properties: {
    grid: {
      type: 'void',
      title: 'aa',
      'x-component': 'Grid',
      properties: {
        row1: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col1: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
              },
              properties: {
                block11: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-content': (
                    <div
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        background: 'rgb(241, 241, 241)',
                      }}
                    >
                      block11
                    </div>
                  ),
                },
              },
            },
            col2: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
                isLast: true,
              },
              properties: {
                block21: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block21',
                  },
                  'x-content': (
                    <div
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        background: 'rgb(241, 241, 241)',
                      }}
                    >
                      block21
                    </div>
                  ),
                },
              },
            },
          },
        },
        row2: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col21: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 3,
              },
              properties: {
                block211: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-content': (
                    <div
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        background: 'rgb(241, 241, 241)',
                      }}
                    >
                      block211
                    </div>
                  ),
                },
              },
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 2 / 3,
                isLast: true,
              },
              properties: {
                block221: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-content': (
                    <div
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        background: 'rgb(241, 241, 241)',
                      }}
                    >
                      block221
                    </div>
                  ),
                },
              },
            },
          },
        },
        row3: {
          type: 'void',
          'x-component': 'Grid.Row',
          'x-component-props': {
            isLast: true,
          },
          properties: {
            col31: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
                isLast: true,
              },
              properties: {
                block311: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-content': (
                    <div
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        background: 'rgb(241, 241, 241)',
                      }}
                    >
                      block311
                    </div>
                  ),
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
  return <SchemaBlock schema={schema} />;
};
