import { ActionInitializer } from '@nocobase/client';
import React from 'react';

export const CommentRecordViewActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("View") }}',
    'x-action': 'view',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      openMode: 'drawer',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("View record") }}',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Details")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    properties: {
                      '7ypqrxaqysp': {
                        type: 'void',
                        'x-component': 'Grid.Row',
                        properties: {
                          '1fc2l8dwe7m': {
                            type: 'void',
                            'x-component': 'Grid.Col',
                            properties: {
                              commentBlock: {
                                type: 'void',
                                'x-designer': 'CommentBlock.Designer',
                                'x-decorator': 'CommentBlock.Decorator',
                                'x-component': 'CommentBlock',
                                'x-component-props': {
                                  from: 'commentRecord',
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
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
